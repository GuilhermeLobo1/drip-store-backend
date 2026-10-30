const { Category } = require('../models');

class CategoryService {
    async search(query) {
        let limit = query.limit !== undefined ? parseInt(query.limit, 10) : 12;
        let page = query.page !== undefined ? parseInt(query.page, 10) : 1;

        if (isNaN(limit) || (limit < -1 || limit === 0)) {
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
        if (query.use_in_menu !== undefined) {
            if (query.use_in_menu === 'true' || query.use_in_menu === '1') {
                where.use_in_menu = true;
            } else if (query.use_in_menu === 'false' || query.use_in_menu === '0') {
                where.use_in_menu = false;
            } else {
                const error = new Error('Parâmetro use_in_menu inválido');
                error.status = 400;
                throw error;
            }
        }

        let attributes = ['id', 'name', 'slug', 'use_in_menu'];
        if (query.fields) {
            const requestedFields = query.fields.split(',').map((f) => f.trim());
            attributes = ['id', ...requestedFields.filter((f) => f !== 'id')];
        }

        const queryOptions = {
            where,
            attributes,
        };

        if (limit !== -1) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
        }

        const { count, rows } = await Category.findAndCountAll(queryOptions);

        return {
            data: rows,
            total: count,
            limit,
            page: limit === -1 ? 1 : page,
        };
    }

    async getById(id) {
        const category = await Category.findByPk(id, {
            attributes: ['id', 'name', 'slug', 'use_in_menu'],
        });
        return category;
    }

    async create(data) {
        const { name, slug, use_in_menu } = data;

        if (!name || !slug) {
            const error = new Error('Os campos name e slug são obrigatórios');
            error.status = 400;
            throw error;
        }

        const category = await Category.create({
            name,
            slug,
            use_in_menu: use_in_menu !== undefined ? Boolean(use_in_menu) : false,
        });

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            use_in_menu: category.use_in_menu,
        };
    }

    async update(id, data) {
        const { name, slug, use_in_menu } = data;

        if (!name || !slug) {
            const error = new Error('Os campos name e slug são obrigatórios');
            error.status = 400;
            throw error;
        }

        const category = await Category.findByPk(id);
        if (!category) {
            const error = new Error('Categoria não encontrada');
            error.status = 404;
            throw error;
        }

        await category.update({
            name,
            slug,
            use_in_menu: use_in_menu !== undefined ? Boolean(use_in_menu) : category.use_in_menu,
        });

        return true;
    }

    async delete(id) {
        const category = await Category.findByPk(id);
        if (!category) {
            const error = new Error('Categoria não encontrada');
            error.status = 404;
            throw error;
        }

        await category.destroy();
        return true;
    }
}

module.exports = new CategoryService();