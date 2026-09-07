require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const corsOptions = require("./config/corsoptions");
const cors = require("cors");
const { createServer } = require("http");
const socketConfig = require("./config/socket.js");
const bookingSocketHandler = require("./sockets/booking.handle.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(hpp());
app.use(cors(corsOptions));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { status: 429, message: "Too many requests" },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const server = createServer(app);
const io = socketConfig.init(server);

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  bookingSocketHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// public
app.use("/api/auth", require("./routers/authRoutes.js"));

// manager
app.use("/api/dashboard", require("./routers/Manager/DashboardRoutes.js"));

// suppliers
app.use("/api/suppliers", require("./routers/Manager/supplierRoutes.js"));
app.use("/api/purchases", require("./routers/Manager/purchaseRoutes.js"));

// wareHouse
app.use("/api/wareHouse", require("./routers/Manager/wareHouse/wareHouse.js"));

app.use("/api/job", require("./routers/Manager/jobExecutionRoute.js"));

//treasury
app.use("/api/treasury", require("./routers/Manager/treasuryRoute.js"));
app.use("/api/collections", require("./routers/Manager/collectionsRoutes.js"));
app.use(
  "/api/manager/expenses",
  require("./routers/Manager/expensesRoutes.js"),
);

//finance
app.use(
  "/api/finance",
  require("./routers/Manager/technicianProfileRoutes.js"),
);

// serviceCommissionRoutes
app.use(
  "/api/service-commissions",
  require("./routers/Manager/serves_zone/serviceCommissionRoutes.js"),
);

//technician-earnings
app.use(
  "/api/technician-earnings",
  require("./routers/Manager/technicianEarningsRoutes.js"),
);

// advances
app.use("/api/advances", require("./routers/Manager/advanceRoutes.js"));

app.use(
  "/api/governorates",
  require("./routers/Manager/serves_zone/governorate.js"),
);
app.use("/api/zones", require("./routers/Manager/serves_zone/zonesRoutes.js"));
app.use(
  "/api/services-module",
  require("./routers/Manager/serves_zone/servesRoutes.js"),
);

app.use("/api/booking", require("./routers/Manager/bookingRoutes.js"));
app.use("/api/teams", require("./routers/Manager/teamsRoutes.js"));

app.use("/api/assignments", require("./routers/Manager/assignmentsRoutes.js"));
app.use("/api/invoices", require("./routers/Manager/invoicesRoutes.js"));

app.use("/api/account", require("./routers/accountRoutes.js"));

app.use(
  "/api/notifications",
  require("./routers/Manager/notificationRoute.js"),
);

// team
app.use("/api/team", require("./routers/Teams/TeamRoute.js"));

app.get("/", (_req, res) => res.status(200).json({ status: "Ahmed is ok " }));

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
