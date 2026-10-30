const CategoryService = require('../services/CategoryService');

class CategoryController {
    async search(req, res) {
        try {
            const result = await CategoryService.search(req.query);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const category = await CategoryService.getById(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Categoria não encontrada' });
            }
            return res.status(200).json(category);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async create(req, res) {
        try {
            const category = await CategoryService.create(req.body);
            return res.status(201).json(category);
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }

    async update(req, res) {
        try {
            await CategoryService.update(req.params.id, req.body);
            return res.status(204).send();
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }

    async delete(req, res) {
        try {
            await CategoryService.delete(req.params.id);
            return res.status(204).send();
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }
}

module.exports = new CategoryController();