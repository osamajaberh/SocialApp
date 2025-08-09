import { asyncHandller } from "../utils/response/error.response.js";

import * as dbService from "../DB/db.service.js";
import { UserModel } from "../DB/models/User.model.js";
import { verifyToken ,generateToken } from "../utils/security/token.security.js";

export const authentication = () => {
  return asyncHandller(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return next(new Error("Missing authorization header", { cause: 401 }));
    }

    const [type, token] = authorization.split(" ");

    if (!type || !token) {
      return next(new Error("Invalid authorization format", { cause: 401 }));
    }

    // Determine token signature key
    let signature;
    if (type === "Bearer") {
      signature = process.env.USER_ACCESS_TOKEN;
    } else if (type === "System") {
      signature = process.env.ADMIN_ACCESS_TOKEN;
    } else {
      return next(new Error("Invalid token type", { cause: 401 }));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken({ token, signature });
    } catch (err) {
      return next(new Error("Invalid or expired token", { cause: 401 }));
    }

    if (!decoded?.id) {
      return next(new Error("Invalid token payload", { cause: 401 }));
    }

    // Find user by ID and isDeleted = false
    const user = await dbService.findOne({
      model: UserModel,
      filter: { _id: decoded.id, isDeleted: false },
    });

    if (!user) {
      return next(new Error("User not found", { cause: 404 }));
    }

    // Check if token is invalid due to password change
    const tokenIssuedAt = decoded.iat * 1000;
    const credentialsChangedAt = user.changeCredentialsTime?.getTime() || 0;

    if (credentialsChangedAt > tokenIssuedAt) {
      return next(new Error("Token invalid due to credential change", { cause: 401 }));
    }

    // Attach user to request
    req.loggedInUser = user;

    return next();
  });
};

export const authorization = (allowedRoles = []) => {
  return asyncHandller(async (req, res, next) => {
    const user = req.loggedInUser;

    if (!user) {
      return next(new Error("Authentication required", { cause: 401 }));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new Error("You are not authorized to access this resource", { cause: 403 }));
    }

    return next();
  });
};