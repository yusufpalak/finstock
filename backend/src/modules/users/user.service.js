import bcrypt from 'bcrypt';
import { UserRepository } from './user.repository.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

const repo = new UserRepository();

export class UserService {
    async listByTenantId(tenantId) {
        return repo.listByTenantId(tenantId);
    }

    async listAll() {
        return repo.listAll();
    }

    async create(tenantId, { email, password, name, role }) {
        const existing = await repo.findByEmail(email);
        if (existing) throw new ValidationError('Email already in use');

        const passwordHash = await bcrypt.hash(password, 12);
        return repo.create({
            tenant_id: tenantId,
            email,
            password_hash: passwordHash,
            name,
            role: role || 'staff',
            is_active: 1
        });
    }

    async update(tenantId, id, { email, password, name, role, is_active }) {
        const user = await repo.findById(tenantId, id);
        if (!user) throw new NotFoundError('User not found');

        const updateData = {};
        if (email) {
            const existing = await repo.findByEmail(email);
            if (existing && existing.id !== +id) throw new ValidationError('Email already in use');
            updateData.email = email;
        }
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 12);
        }
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;

        if (Object.keys(updateData).length > 0) {
            await repo.update(tenantId, id, updateData);
        }
        return repo.findById(tenantId, id);
    }

    async delete(tenantId, id) {
        const user = await repo.findById(tenantId, id);
        if (!user) throw new NotFoundError('User not found');

        // Safety check: Don't allow deleting the last owner or oneself easily from here? 
        // Basic implementation for now.
        await repo.delete(tenantId, id);
    }
}
