const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES — yahan upar rakho
const productRoutes = require('./routes/productRoutes');

const testRoute = require("./routes/testRoute");
app.use("/api", testRoute);
app.use('/api/admin/auth', require('./routes/adminAuthRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', productRoutes);

app.use('/api/admin/tenants', require('./routes/adminTenantRoutes'));
app.use('/api/users/auth', require('./routes/userAuthRoutes'));
app.use('/api/users/invite', require('./routes/ownerInviteRoutes'));
//errors handlers
app.use((err, req, res, next) => {
  console.error(err); // optional (for debugging)

  res.status(err.status || 500).json({
    message: err.message || 'Server error'
  });
});

// DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Inventory API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
