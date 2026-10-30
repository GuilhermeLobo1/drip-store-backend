const { Op } = require('sequelize');
const {
    connection,
    Product,
    ProductImage,
    ProductOption,
    ProductCategory,
    Category,
} = require('../models');

class ProductService {
    formatProduct(product, requestedFields = null) {
        const raw = product.toJSON ? product.toJSON() : product;

        const formatted = {
            id: raw.id,
            enabled: Boolean(raw.enabled),
            name: raw.name,
            slug: raw.slug,
            stock: raw.stock,
            description: raw.description,
            price: raw.price,
            price_with_discount: raw.price_with_discount,
            category_ids: raw.categories ? raw.categories.map((c) => c.id) : [],
            images: raw.images
                ? raw.images.map((img) => ({
                    id: img.id,
                    content: img.path,
                }))
                : [],
            options: raw.options
                ? raw.options.map((opt) => ({
                    id: opt.id,
                    title: opt.title,
                    shape: opt.shape,
                    radius: opt.radius,
                    type: opt.type,
                    values: opt.values ? opt.values.split(',') : [],
                }))
                : [],
        };

        if (requestedFields && requestedFields.length > 0) {
            const filtered = { id: formatted.id };
            requestedFields.forEach((field) => {
                if (formatted[field] !== undefined) {
                    filtered[field] = formatted[field];
                }
            });
            return filtered;
        }

        return formatted;
    }

    async search(query) {
        let limit = query.limit !== undefined ? parseInt(query.limit, 10) : 12;
        let page = query.page !== undefined ? parseInt(query.page, 10) : 1;

        if (isNaN(limit) || limit < -1 || limit === 0) {
            const error = new Error('Parâmetro limit inválido');
            error.status = 400;
            throw error;
        }

        if (isNaN(page) || page < 1) {
            const error = new Error('Parâmetro page inválido');
            error.status = 400;
            throw error;
        }

        const where = {};

        if (query.match) {
            where[Op.or] = [
                { name: { [Op.like]: `%${query.match}%` } },
                { description: { [Op.like]: `%${query.match}%` } },
            ];
        }

        if (query['price-range']) {
            const parts = query['price-range'].split('-').map((p) => parseFloat(p));
            if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
                const error = new Error('Parâmetro price-range inválido');
                error.status = 400;
                throw error;
            }
            where.price = { [Op.between]: [parts[0], parts[1]] };
        }

        const include = [
            {
                model: ProductImage,
                as: 'images',
                attributes: ['id', 'path', 'enabled'],
            },
            {
                model: ProductOption,
                as: 'options',
            },
            {
                model: Category,
                as: 'categories',
                attributes: ['id'],
                through: { attributes: [] },
            },
        ];

        if (query.category_ids) {
            const catIds = query.category_ids
                .split(',')
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !isNaN(id));

            if (catIds.length > 0) {
                include[2].where = { id: { [Op.in]: catIds } };
                include[2].required = true;
            }
        }

        if (query.option && typeof query.option === 'object') {
            const optionConditions = [];
            for (const [optId, optVals] of Object.entries(query.option)) {
                const vals = String(optVals)
                    .split(',')
                    .map((v) => v.trim());
                const valLikes = vals.map((v) => ({
                    values: { [Op.like]: `%${v}%` },
                }));
                optionConditions.push({
                    id: parseInt(optId, 10),
                    [Op.or]: valLikes,
                });
            }
            if (optionConditions.length > 0) {
                include[1].where = { [Op.or]: optionConditions };
                include[1].required = true;
            }
        }

        const queryOptions = {
            where,
            include,
            distinct: true,
        };

        if (limit !== -1) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
        }

        const { count, rows } = await Product.findAndCountAll(queryOptions);

        const requestedFields = query.fields
            ? query.fields.split(',').map((f) => f.trim())
            : null;

        const data = rows.map((product) =>
            this.formatProduct(product, requestedFields)
        );

        return {
            data,
            total: count,
            limit,
            page: limit === -1 ? 1 : page,
        };
    }

    async getById(id) {
        const product = await Product.findByPk(id, {
            include: [
                { model: ProductImage, as: 'images' },
                { model: ProductOption, as: 'options' },
                {
                    model: Category,
                    as: 'categories',
                    attributes: ['id'],
                    through: { attributes: [] },
                },
            ],
        });

        if (!product) return null;
        return this.formatProduct(product);
    }

    async create(data) {
        const {
            enabled,
            name,
            slug,
            use_in_menu,
            stock,
            description,
            price,
            price_with_discount,
            category_ids,
            images,
            options,
        } = data;

        if (
            !name ||
            !slug ||
            price === undefined ||
            price_with_discount === undefined
        ) {
            const error = new Error(
                'Campos obrigatórios: name, slug, price, price_with_discount'
            );
            error.status = 400;
            throw error;
        }

        const transaction = await connection.transaction();

        try {
            const product = await Product.create(
                {
                    enabled: enabled !== undefined ? Boolean(enabled) : false,
                    name,
                    slug,
                    use_in_menu: use_in_menu !== undefined ? Boolean(use_in_menu) : false,
                    stock: stock !== undefined ? parseInt(stock, 10) : 0,
                    description: description || null,
                    price: parseFloat(price),
                    price_with_discount: parseFloat(price_with_discount),
                },
                { transaction }
            );

            if (Array.isArray(category_ids) && category_ids.length > 0) {
                const categoryLinks = category_ids.map((catId) => ({
                    product_id: product.id,
                    category_id: catId,
                }));
                await ProductCategory.bulkCreate(categoryLinks, { transaction });
            }

            if (Array.isArray(images) && images.length > 0) {
                const imageRecords = images.map((img) => ({
                    product_id: product.id,
                    enabled: true,
                    path: img.content || img.path || '',
                }));
                await ProductImage.bulkCreate(imageRecords, { transaction });
            }

            if (Array.isArray(options) && options.length > 0) {
                const optionRecords = options.map((opt) => {
                    const rawValues = opt.values || opt.value || [];
                    const formattedValues = Array.isArray(rawValues)
                        ? rawValues.join(',')
                        : String(rawValues);

                    const parsedRadius = opt.radius
                        ? parseInt(String(opt.radius).replace(/\D/g, ''), 10) || 0
                        : 0;

                    return {
                        product_id: product.id,
                        title: opt.title,
                        shape: opt.shape || 'square',
                        radius: parsedRadius,
                        type: opt.type || 'text',
                        values: formattedValues,
                    };
                });
                await ProductOption.bulkCreate(optionRecords, { transaction });
            }

            await transaction.commit();
            return await this.getById(product.id);
        } catch (error) {
            await transaction.rollback();
            error.status = error.status || 400;
            throw error;
        }
    }

    async update(id, data) {
        const product = await Product.findByPk(id);
        if (!product) {
            const error = new Error('Produto não encontrado');
            error.status = 404;
            throw error;
        }

        const transaction = await connection.transaction();

        try {
            await product.update(
                {
                    enabled:
                        data.enabled !== undefined ? Boolean(data.enabled) : product.enabled,
                    name: data.name !== undefined ? data.name : product.name,
                    slug: data.slug !== undefined ? data.slug : product.slug,
                    use_in_menu:
                        data.use_in_menu !== undefined
                            ? Boolean(data.use_in_menu)
                            : product.use_in_menu,
                    stock:
                        data.stock !== undefined ? parseInt(data.stock, 10) : product.stock,
                    description:
                        data.description !== undefined
                            ? data.description
                            : product.description,
                    price:
                        data.price !== undefined ? parseFloat(data.price) : product.price,
                    price_with_discount:
                        data.price_with_discount !== undefined
                            ? parseFloat(data.price_with_discount)
                            : product.price_with_discount,
                },
                { transaction }
            );

            if (Array.isArray(data.category_ids)) {
                await ProductCategory.destroy({
                    where: { product_id: product.id },
                    transaction,
                });
                if (data.category_ids.length > 0) {
                    const categoryLinks = data.category_ids.map((catId) => ({
                        product_id: product.id,
                        category_id: catId,
                    }));
                    await ProductCategory.bulkCreate(categoryLinks, { transaction });
                }
            }

            if (Array.isArray(data.images)) {
                for (const img of data.images) {
                    if (img.id && img.deleted) {
                        await ProductImage.destroy({
                            where: { id: img.id, product_id: product.id },
                            transaction,
                        });
                    } else if (img.id && (img.content || img.path)) {
                        await ProductImage.update(
                            { path: img.content || img.path },
                            { where: { id: img.id, product_id: product.id }, transaction }
                        );
                    } else if (!img.id && (img.content || img.path)) {
                        await ProductImage.create(
                            {
                                product_id: product.id,
                                enabled: true,
                                path: img.content || img.path,
                            },
                            { transaction }
                        );
                    }
                }
            }

            if (Array.isArray(data.options)) {
                for (const opt of data.options) {
                    if (opt.id && opt.deleted) {
                        await ProductOption.destroy({
                            where: { id: opt.id, product_id: product.id },
                            transaction,
                        });
                    } else if (opt.id) {
                        const updateFields = {};
                        if (opt.title !== undefined) updateFields.title = opt.title;
                        if (opt.shape !== undefined) updateFields.shape = opt.shape;
                        if (opt.type !== undefined) updateFields.type = opt.type;
                        if (opt.radius !== undefined) {
                            updateFields.radius =
                                parseInt(String(opt.radius).replace(/\D/g, ''), 10) || 0;
                        }
                        if (opt.values !== undefined || opt.value !== undefined) {
                            const rawVals = opt.values || opt.value;
                            updateFields.values = Array.isArray(rawVals)
                                ? rawVals.join(',')
                                : String(rawVals);
                        }
                        await ProductOption.update(updateFields, {
                            where: { id: opt.id, product_id: product.id },
                            transaction,
                        });
                    } else if (!opt.id && opt.title) {
                        const rawVals = opt.values || opt.value || [];
                        const formattedValues = Array.isArray(rawVals)
                            ? rawVals.join(',')
                            : String(rawVals);
                        const parsedRadius = opt.radius
                            ? parseInt(String(opt.radius).replace(/\D/g, ''), 10) || 0
                            : 0;

                        await ProductOption.create(
                            {
                                product_id: product.id,
                                title: opt.title,
                                shape: opt.shape || 'square',
                                radius: parsedRadius,
                                type: opt.type || 'text',
                                values: formattedValues,
                            },
                            { transaction }
                        );
                    }
                }
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            error.status = error.status || 400;
            throw error;
        }
    }

    async delete(id) {
        const product = await Product.findByPk(id);
        if (!product) {
            const error = new Error('Produto não encontrado');
            error.status = 404;
            throw error;
        }

        await product.destroy();
        return true;
    }
}

module.exports = new ProductService();