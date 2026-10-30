const UserService = require('../services/UserService');

class UserController {
    async getById(req, res) {
        try {
            const user = await UserService.getById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            return res.status(200).json(user);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async create(req, res) {
        try {
            const user = await UserService.create(req.body);
            return res.status(201).json(user);
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }

    async update(req, res) {
        try {
            await UserService.update(req.params.id, req.body);
            return res.status(204).send();
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }

    async delete(req, res) {
        try {
            await UserService.delete(req.params.id);
            return res.status(204).send();
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const token = await UserService.generateToken(email, password);
            return res.status(200).json({ token });
        } catch (error) {
            return res.status(error.status || 400).json({ message: error.message });
        }
    }
}

module.exports = new UserController();