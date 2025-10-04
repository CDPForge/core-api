import { User as UserModel } from "../users/user.model"; // Adatta il path alla tua struttura

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string | number;
        user: Partial<UserModel>;
        permissions: {
          client?: number;
          instance?: number;
          permissions: { permission: string; level: number }[];
        }[];
      };
      token?: string;
      cookies?: any;
    }
  }
}
