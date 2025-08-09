import database_Connection from "./DB/connection.js";
import authController from "./modules/auth/auth.controller.js";
import { golobalErrorHandling } from "./utils/response/error.response.js";
import userController from "./modules/User/user.controller.js";
import path from "node:path";
import postController from "./modules/post/post.controller.js";
import { rateLimit } from 'express-rate-limit'
import helmet from "helmet";

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 15 minutes
	limit: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.



const bootstarp = (app, express) => {
  app.use(express.json());
  app.use(helmet());
  app.use("/auth",limiter)
  app.use("/uploads", express.static(path.resolve("./src/uploads")));
  app.use("/auth", authController);
  app.use("/user", userController);
  app.use("/post", postController);


  app.all(/^.*$/, (req, res, next) => {
    res.status(404).json({ message: "page not found" });
  });

  app.use(golobalErrorHandling);

  database_Connection();
};

export default bootstarp;
