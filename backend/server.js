require("./config/env");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const path = require('path');

/* =========================
   CORS CONFIG (FIXED)
========================= */

// Express CORS - Allow all origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Increase JSON body size to allow base64 image uploads from frontend
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   SOCKET.IO (FIXED CORS)
========================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED:", socket.id);

  socket.on("join-tenant", (tenantId) => {
    if (!tenantId) return;

    const room = String(tenantId);

    // Leave previous tenant rooms so alerts do not leak across tenants
    for (const joinedRoom of socket.rooms) {
      if (joinedRoom !== socket.id) {
        socket.leave(joinedRoom);
      }
    }

    socket.join(room);
    socket.data.tenantId = room;

    console.log("JOINED ROOM:", room);
    console.log("ROOMS:", [...socket.rooms]);
  });
});

app.set("io", io);

/* =========================
   ROUTES
========================= */

const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const salesRoutes = require("./routes/salesRoutes");
const ownerInviteRoutes = require("./routes/userActivationRoutes.js");
const testRoute = require("./routes/testRoute");
const batchRoutes = require("./routes/batchRoutes");

app.use("/api", testRoute);
app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/warehouses", require("./routes/warehouseRoutes"));
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/purchases", require("./routes/purchaseRoutes"));
app.use("/api/stock-transfers", require("./routes/stockTransferRoutes"));
app.use("/api/sales", salesRoutes);
app.use("/api/return-exchange", require("./routes/returnExchangeRoutes"));
app.use("/api/promotions", require("./routes/promotionsRoutes"));
app.use("/api/admin/plans", require("./routes/adminPlanRoutes"));
app.use("/api/admin/tenants", require("./routes/adminTenantRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/admin/revenue", require("./routes/adminRevenueRoutes"));
app.use("/api/admin/integrations", require("./routes/adminIntegrationRoutes"));
app.use("/api/users/auth", require("./routes/userAuthRoutes"));
app.use("/api/users/manage", require("./routes/userManagementRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/rag', require('./routes/ragRoutes'));
app.use("/api/users/invite", ownerInviteRoutes);

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error(err);

  if (
    err.name === "MongooseBufferError" ||
    err.name === "MongoNetworkError" ||
    (typeof err.message === "string" &&
      err.message.includes("buffering timed out"))
  ) {
    return res.status(503).json({
      errorField: "general",
      message: "Database unavailable. Please retry.",
    });
  }

  res.status(err.status || 500).json({
    errorField: err.errorField || "general",
    message: err.message || "Server error",
  });
});

/* =========================
   DATABASE CONNECTION
========================= */

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error("Missing MongoDB connection string in .env");
  process.exit(1);
}

mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("MongoDB Connected");

    // One-time: old product labeled role "manager" as Cashier — convert once
    try {
      const User = require("./models/tenant/User");
      const flagId = new mongoose.Types.ObjectId("000000000000000000000001");
      const flagColl = mongoose.connection.collection("system_migrations");
      const already = await flagColl.findOne({ _id: flagId, name: "manager_to_cashier_v1" });
      if (!already) {
        const result = await User.updateMany(
          { role: "manager" },
          { $set: { role: "cashier" } }
        );
        await flagColl.insertOne({
          _id: flagId,
          name: "manager_to_cashier_v1",
          at: new Date(),
          modifiedCount: result.modifiedCount,
        });
        console.log(
          `One-time migration manager→cashier: ${result.modifiedCount} users`
        );
      }
      const staffResult = await User.updateMany(
        { role: "staff" },
        { $set: { role: "cashier" } }
      );
      if (staffResult.modifiedCount) {
        console.log(`Role migration: ${staffResult.modifiedCount} staff→cashier`);
      }
    } catch (migrateErr) {
      console.warn("Role migration skipped:", migrateErr.message);
    }

    // One-time: invoiceId was globally unique — blocks other tenants from INV-000001
    try {
      const flagId = new mongoose.Types.ObjectId("000000000000000000000002");
      const flagColl = mongoose.connection.collection("system_migrations");
      const already = await flagColl.findOne({
        _id: flagId,
        name: "sale_invoice_tenant_unique_v1",
      });
      if (!already) {
        const salesColl = mongoose.connection.collection("sales");
        const indexes = await salesColl.indexes();
        const globalInvoiceIdx = indexes.find(
          (idx) =>
            idx.key &&
            idx.key.invoiceId === 1 &&
            Object.keys(idx.key).length === 1 &&
            idx.unique
        );
        if (globalInvoiceIdx?.name) {
          await salesColl.dropIndex(globalInvoiceIdx.name);
          console.log(`Dropped global sale index: ${globalInvoiceIdx.name}`);
        }
        await salesColl.createIndex(
          { tenantId: 1, invoiceId: 1 },
          { unique: true, name: "tenantId_1_invoiceId_1" }
        );
        await flagColl.insertOne({
          _id: flagId,
          name: "sale_invoice_tenant_unique_v1",
          at: new Date(),
        });
        console.log("Sale invoice uniqueness is now per-tenant");
      }
    } catch (invoiceMigrateErr) {
      console.warn("Sale invoice index migration skipped:", invoiceMigrateErr.message);
    }

    app.get("/", (req, res) => {
      res.send("Inventory API Running");
    });

    const PORT = process.env.PORT || 5000;
    const { initBackupScheduler } = require('./service/backupScheduler');

    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
      initBackupScheduler();
      if (process.env.GROQ_API_KEY) {
        console.log('Groq AI (RAG) configured');
      } else {
        console.warn('GROQ_API_KEY missing — AI queries will return configuration error');
      }
      if (process.env.TAVILY_API_KEY) {
        console.log('Tavily web search (external RAG) configured');
      } else {
        console.warn('TAVILY_API_KEY missing — AI answers will use internal inventory data only');
      }
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });