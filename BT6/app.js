const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// --- CẤU HÌNH KẾT NỐI MONGODB ATLAS ---
const uri = "mongodb+srv://tranduytan1612003:YjG-aF6YQRsc_hT@cluster0.ix4ksux.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
    .then(() => console.log('Kết nối MongoDB Atlas thành công!'))
    .catch((err) => console.error('Lỗi kết nối:', err));

// --- ĐỊNH NGHĨA SCHEMA ---
const { Schema } = mongoose;

const roleSchema = new Schema({
    name: { type: String, unique: true, required: true },
    description: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, default: "" },
    avatarUrl: { type: String, default: "https://i.sstatic.net/l60Hf.png" },
    status: { type: Boolean, default: false },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    loginCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);



// --- CÁC API ---

// 1. CRUD User
app.get('/users', async (req, res) => {
    const { username } = req.query;
    let filter = { isDeleted: false };
    if (username) filter.username = { $regex: username, $options: 'i' };
    const users = await User.find(filter).populate('role');
    res.json(users);
});

app.get('/users/:id', async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    res.json(user);
});

app.delete('/users/:id', async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "User đã bị xóa mềm" });
});

// 1. CRUD Role (Thêm mới)
app.get('/roles', async (req, res) => {
    res.json(await Role.find({ isDeleted: false }));
});

app.delete('/roles/:id', async (req, res) => {
    await Role.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Role đã bị xóa mềm" });
});

// 2 & 3. API Enable / Disable Status
app.post('/enable', async (req, res) => {
    const { email, username } = req.body;
    const user = await User.findOneAndUpdate({ email, username, isDeleted: false }, { status: true }, { new: true });
    user ? res.json({ message: "Status enabled", user }) : res.status(404).send("User not found");
});

app.post('/disable', async (req, res) => {
    const { email, username } = req.body;
    const user = await User.findOneAndUpdate({ email, username, isDeleted: false }, { status: false }, { new: true });
    user ? res.json({ message: "Status disabled", user }) : res.status(404).send("User not found");
});

// 4. Lấy tất cả user theo Role ID
app.get('/roles/:id/users', async (req, res) => {
    const users = await User.find({ role: req.params.id, isDeleted: false });
    res.json(users);
});

// --- SCRIPT TỰ ĐỘNG THÊM DỮ LIỆU TEST ---
const seedData = async () => {
    const count = await User.countDocuments();
    if (count === 0) {
        const adminRole = await Role.create({ name: "Admin", description: "Quản trị viên" });
        await User.create({
            username: "tan123",
            password: "123",
            email: "tan@example.com",
            fullName: "Trần Duy Tân",
            role: adminRole._id
        });
        console.log("Đã tạo dữ liệu mẫu thành công!");
    }
};
mongoose.connection.once('open', seedData);

app.listen(3000, () => console.log('Server chạy tại http://localhost:3000'));