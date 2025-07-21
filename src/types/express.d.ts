import { User as UserModel } from "../users/user.model"; // Adatta il path alla tua struttura

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
    }
  }
}
