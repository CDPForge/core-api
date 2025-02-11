import { getMockReq, getMockRes } from '@jest-mock/express';
import { authenticateToken } from '../../src/middleware/authMiddleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../src/models/userclientroles');

describe('Auth Middleware', () => {
    const { res, clearMockRes } = getMockRes();
    const next = jest.fn();

    beforeEach(() => {
        clearMockRes();
        next.mockClear();
    });

    describe('isAuthenticated', () => {
        it('dovrebbe passare se il token e il clientId sono validi', async () => {
            const req = getMockReq({
                cookies: {
                    accessToken: 'valid-token'
                },
                headers: {
                    'x-client-id': '1'
                }
            });

            (jwt.verify as jest.Mock).mockReturnValue({
                id: 1,
                username: 'test@example.com',
                clients: [
                    { client: 1, role: 'admin' }
                ]
            });

            await authenticateToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual({
                id: 1,
                username: 'test@example.com',
                clients: [
                    { client: 1, role: 'admin' }
                ],
                currentClientRole: 'admin',
                currentClientId: 1
            });
        });

        it('dovrebbe bloccare se il token è mancante', async () => {
            const req = getMockReq({
                headers: {
                    'x-client-id': '1'
                }
            });

            await authenticateToken(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token di accesso mancante'
            });
        });

        it('dovrebbe bloccare se il clientId è mancante', async () => {
            const req = getMockReq({
                cookies: {
                    accessToken: 'valid-token'
                },
            });

            await authenticateToken(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Client ID mancante'
            });
        });

        it('dovrebbe bloccare se il token non è valido', async () => {

            const req = getMockReq({
                cookies: {
                    accessToken: 'invalid-token'
                },
                headers: {
                    'x-client-id': '1'
                }
            });

            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Token non valido');
            });

            await authenticateToken(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token non valido o scaduto'
            });
        });

        it('dovrebbe bloccare se l\'utente non ha accesso al client', async () => {
            const req = getMockReq({
                cookies: {
                    accessToken: 'valid-token'
                },
                headers: {
                    'x-client-id': '1'
                }
            });

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                id: 1,
                email: 'test@test.com',
                clients: [
                    { client: 2, role: 'admin' },
                    { client: 3, role: 'user' }
                ]
            }));

            await authenticateToken(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Non hai accesso a questo client'
            });
        });
    });
}); 