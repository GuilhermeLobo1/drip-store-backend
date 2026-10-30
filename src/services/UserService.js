const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class UserService {
    async getById(id) {
        const user = await User.findByPk(id, {
            attributes: ['id', 'firstname', 'surname', 'email'],
        });
        return user;
    }

    async create(data) {
        const { firstname, surname, email, password, confirmPassword } = data;

        if (!firstname || !surname || !email || !password) {
            const error = new Error('Todos os campos obrigatórios devem ser preenchidos');
            error.status = 400;
            throw error;
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            const error = new Error('As senhas não conferem');
            error.status = 400;
            throw error;
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            const error = new Error('Email já cadastrado');
            error.status = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstname,
            surname,
            email,
            password: hashedPassword,
        });

        return {
            id: user.id,
            firstname: user.firstname,
            surname: user.surname,
            email: user.email,
        };
    }

    async update(id, data) {
        const { firstname, surname, email } = data;

        if (!firstname || !surname || !email) {
            const error = new Error('Dados incorretos ou incompletos');
            error.status = 400;
            throw error;
        }

        const user = await User.findByPk(id);
        if (!user) {
            const error = new Error('Usuário não encontrado');
            error.status = 404;
            throw error;
        }

        await user.update({ firstname, surname, email });
        return true;
    }

    async delete(id) {
        const user = await User.findByPk(id);
        if (!user) {
            const error = new Error('Usuário não encontrado');
            error.status = 404;
            throw error;
        }

        await user.destroy();
        return true;
    }

    async generateToken(email, password) {
        if (!email || !password) {
            const error = new Error('Email e senha são obrigatórios');
            error.status = 400;
            throw error;
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            const error = new Error('Credenciais inválidas');
            error.status = 400;
            throw error;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            const error = new Error('Credenciais inválidas');
            error.status = 400;
            throw error;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        return token;
    }
}

module.exports = new UserService();