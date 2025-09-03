const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;
app.use(express.static(path.join(__dirname, "public")));
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إضافة السيشن
app.use(
  session({
    secret: "my-secret-key", 
    resave: false,
    saveUninitialized: false,
  })
);

// ملف المستخدمين
const USERS_FILE = "users.json";

// تحميل المستخدمين من JSON
let users = [];
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

// دالة لحفظ المستخدمين
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================= تسجيل مستخدم جديد =================
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).send("⚠️ ادخل يوزر وباسورد");

  if (users.find((u) => u.username === username)) {
    return res.status(400).send("⚠️ اليوزر موجود بالفعل");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword };
  users.push(newUser);
  saveUsers();

  res.redirect("/login");
});

// ================= تسجيل الدخول =================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);
  if (!user) return res.status(400).send("⚠️ يوزر أو باسورد غلط");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).send("⚠️ يوزر أو باسورد غلط");

  req.session.user = username;

  res.redirect("/dashboard");
});

// ================= Middleware للحماية =================
function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// ================= الصفحة الرئيسية بعد تسجيل الدخول =================
app.get("/dashboard", authMiddleware, (req, res) => {
  res.send(`
    <!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <title>الداشبورد</title>
  <style>
    body {
      font-family: 'Cairo', sans-serif;
      margin: 0;
      background: linear-gradient(to bottom, #1e1e2f, #2c3e50);
      color: #fff;
      line-height: 1.8;
    }
    h1 {
      color: #f1c40f;
    }
    header {
      padding: 10px 20px;
      margin-bottom: 20px;
      text-align:end;
      background-color: #f1c40f;
      color: #1e1e2f;
    }
    nav {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      padding: 15px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    nav .logo { color: #f1c40f; font-size: 1.6em; font-weight: bold; }
    nav ul { list-style: none; display: flex; gap: 25px; }
    nav ul li a { color: #fff; text-decoration: none; padding: 8px 15px; }
    nav ul li a:hover { color: #f1c40f; }
    section { text-align: center; padding: 40px 20px; }
    .Exams, .leaders {
      margin: 20px auto;
      padding: 20px;
      max-width: 400px;
      background: #0f0f0f;
      border-radius: 15px;
    }
    .Exams:hover, .leaders:hover { background: #f1c40f; color: #1e1e2f; }
    .exam, .leader {
      display: inline-block;
      margin-top: 15px;
      padding: 10px 20px;
      background: blue;
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
    }
    /* موبايل */
    @media (max-width:768px){
      nav ul { display:none; flex-direction:column; position:absolute; top:70px; right:10px; background:#000; padding:20px; }
      nav ul.active { display:flex; }
      .menu-toggle { display:block; cursor:pointer; }
    }
  </style>
</head>
<body>
  <header>
    <h3>${req.session.user} أهلاً </h3>
    <p>إنت دلوقتي مسجل الدخول</p>
  </header>
  <nav>
    <div class="logo">👑 G10 Empire</div>
    <div class="menu-toggle" onclick="toggleMenu()">☰</div>
    <ul id="nav-links">
      <li><a href="/">الرئيسية</a></li>
      <li><a href="/logout">تسجيل الخروج</a></li>
      <li><a href="/contact">تواصل</a></li>
    </ul>
  </nav>
  <section>
    <img src="/logo.jpg" style="width:100px; border-radius:20%">
    <h1>G10 Empire Giants 👑</h1>
    <p>الأسطورة تبدأ من هنا 💥</p>
  </section>
  <section>
    <div class="Exams">
      <h2>Go To Exams section</h2>
      <a href="#" id="exm" class="exam" onclick="alert('لا يزال العمل قائما')">Exams</a>

    </div>
  </section>
  <section>
    <div class="leaders">
      <h2>See The leaderboard</h2>
      <a href="/leader" class="leader">Leader Board</a>
    </div>
  </section>
  <script>
    function toggleMenu(){
      document.getElementById("nav-links").classList.toggle("active");
    }
  </script>
</body>
</html>

  `);
});
//================================================
app.get("/leader", authMiddleware, (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة الشرف - League of Legends Community</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      direction: rtl;
    }
  </style>
</head>
<body class="bg-gray-900 text-white">
  <!-- Header -->
  <header class="bg-gray-800 p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">🏆 لوحة الشرف</h1>
    <a href="/" class="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-300">الرجوع للرئيسية</a>
  </header>

  <!-- Leaderboard Title -->
  <section class="text-center mt-10">
    <h2 class="text-3xl font-extrabold mb-2">أفضل اللاعبين هذا الأسبوع</h2>
    <p class="text-gray-300">ترتيب اللاعبين حسب النقاط المكتسبة في مجتمع Quiz Battle 🤩</p>
  </section>

  <!-- Leaderboard Table -->
  <section class="max-w-4xl mx-auto mt-10">
    <div class="overflow-x-auto">
      <table class="w-full table-auto border-collapse">
        <thead>
          <tr class="bg-yellow-500 text-black">
            <th class="p-3 text-right">المركز</th>
            <th class="p-3 text-right">اسم اللاعب</th>
            <th class="p-3 text-right">عدد الانتصارات</th>
            <th class="p-3 text-right">النقاط</th>
          </tr>
        </thead>
        <tbody class="bg-gray-800 divide-y divide-gray-700">
            <td class="p-3">1</td>
            <td class="p-3">Ahd Mahmoud</td>
            <td class="p-3">2</td>
            <td class="p-3">50</td>
          </tr>
          <tr>
            <td class="p-3">2</td>
            <td class="p-3">Zaineb</td>
            <td class="p-3">1</td>
            <td class="p-3">25</td>
          </tr>
          <tr>

          <tr>
            <td class="p-3">3</td>
            <td class="p-3">Maryam Ali</td>
            <td class="p-3">1</td>
            <td class="p-3">25</td>
          </tr>
          <!-- Add more rows as needed -->
                     <tr>
            <td class="p-3">4</td>
            <td class="p-3">Salma Mohamed</td>
            <td class="p-3">1</td>
            <td class="p-3">25</td>
          </tr>
                    <tr>
            <td class="p-3">5</td>
            <td class="p-3">Salma Elfeqy</td>
            <td class="p-3">1</td>
            <td class="p-3">25</td>
          </tr>
                    <tr>
            <td class="p-3">3</td>
            <td class="p-3">Maryam Anes</td>
            <td class="p-3">1</td>
            <td class="p-3">25</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Footer -->
  <footer class="mt-16 p-6 text-center text-gray-400 text-sm">
    &copy; 2025 G10 Giants Empire 🫶📚 - جميع الحقوق محفوظة
  </footer>
</body>
</html>

  `);
});
// ================================================
app.get("/contact", authMiddleware, (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تواصل مع الأدمنز | G10 Giants Empire</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f0f0f;
      font-family: 'Segoe UI', sans-serif;
      color: #fff;
    }

    header {
      background: linear-gradient(45deg, #00ff88, #00ccff);
      padding: 20px;
      text-align: center;
      color: #000;
      font-weight: bold;
      font-size: 28px;
    }

    section.contact {
      padding: 60px 20px;
      text-align: center;
    }

    section.contact h3 {
      font-size: 34px;
      margin-bottom: 15px;
      color: #00ff88;
    }

    section.contact p {
      font-size: 18px;
      margin-bottom: 50px;
      color: #ccc;
    }

    .admins {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 25px;
    }

    .admin-card {
      background-color: #1a1a1a;
      padding: 25px 20px;
      border-radius: 18px;
      border: 2px solid #00ccff;
      width: 220px;
      box-shadow: 0 0 12px #00ccff;
      transition: 0.3s ease;
    }

    .admin-card:hover {
      transform: scale(1.05);
      box-shadow: 0 0 20px #00ff88;
    }

    .admin-card h4 {
      font-size: 22px;
      color: gold;
      margin-bottom: 12px;
    }

    .admin-card p {
      font-size: 16px;
      color: #aaa;
      margin-bottom: 10px;
    }

    .admin-card a {
      display: inline-block;
      background: #25d366;
      color: #fff;
      padding: 10px 16px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: bold;
      transition: 0.3s;
    }

    .admin-card a:hover {
      background: #1ebe57;
      box-shadow: 0 0 10px #25d366;
    }

    footer {
      text-align: center;
      padding: 20px;
      background: #000;
      color: #888;
      font-size: 14px;
      margin-top: 60px;
    }
    a{
      padding: 10px 15px;
      text-decoration: none;
      color: #000;
      background-color: #1ebe57;
    }
  </style>
</head>
<body>
<a href="/">الصفحة الرئيسية</a>
<header>📲 تواصل مع الأدمنز على واتساب</header>

<section class="contact">
  <h3>راسل أي أدمن على طول 👇</h3>
  <p>لو محتاج حاجة أو حابب تسأل أي سؤال، إحنا موجودين 💬</p>

  <div class="admins">
    <div class="admin-card">
      <h4>محمد عبد الفتاح</h4>
      <p>واتساب مباشر</p>
      <a href="https://wa.me/+201285536282" target="_blank">راسل محمد</a>
    </div>
    <div class="admin-card">
      <h4>حبيبة وليد</h4>
      <p>واتساب مباشر</p>
      <a href="https://wa.me/+201117078434" target="_blank">راسل حبيبة</a>
    </div>
    <div class="admin-card">
      <h4>عزه احمد</h4>
      <p>واتساب مباشر</p>
      <a href="https://wa.me/+201099189906" target="_blank">راسل عزه</a>
    </div>

  </div>
</section>

<footer>
  © 2025 <b>G10 Empire Giants</b> | كل الحقوق محفوظة ❤️
</footer>

</body>
</html>


  `);
});
// ================= تسجيل الخروج =================
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ================= صفحة البداية =================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>G10 Empire Giants 👑</title>
  <style>
    body {
      font-family: 'Cairo', sans-serif;
      margin: 0;
      background: linear-gradient(to bottom, #1e1e2f, #2c3e50);
      color: #fff;
      line-height: 1.8;
    }

    header {
      background-color: #f1c40f;
      color: #1e1e2f;
      padding: 40px 20px;
      text-align: center;
    }

    header h1 {
      font-size: 2.8em;
      margin: 0;
    }

    section {
      padding: 40px 20px;
      text-align: center;
    }

    section h2 {
      color: #f39c12;
      font-size: 2em;
    }

    section p {
      max-width: 700px;
      margin: 0 auto 20px;
      font-size: 1.2em;
      color: #ddd;
    }

    .features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 30px;
      margin-top: 30px;
    }

    .feature {
      background: #34495e;
      padding: 20px;
      border-radius: 12px;
      width: 250px;
      box-shadow: 0 0 10px #00000044;
    }

    .feature h3 {
      color: #2ecc71;
    }

    .cta {
      margin-top: 40px;
    }

    .cta a {
      display: inline-block;
      background-color: #27ae60;
      color: #fff;
      padding: 15px 30px;
      font-size: 1.2em;
      text-decoration: none;
      border-radius: 8px;
      transition: 0.3s;
    }

    .cta a:hover {
      background-color: #2ecc71;
      transform: scale(1.05);
    }

    footer {
      background-color: #111;
      color: #888;
      text-align: center;
      padding: 20px;
      font-size: 0.9em;
    }

    .Adm {
      text-decoration: none;
      color: #ecdfdf;
      background-color: #3a3737;
      padding: 20px;
      border: solid 3px #1e1e2f;
      border-radius: 40px;
      display: inline-block;
      margin: 20px auto;
    }

    img {
      max-width: 100%;
      border-radius: 12px;
      margin-top: 20px;
    }

    /* ===== الناف بار ===== */
    nav {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      padding: 15px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }

    nav .logo {
      font-size: 1.6em;
      font-weight: bold;
      color: #f1c40f;
      text-shadow: 0 0 10px #f39c12;
    }

    nav ul {
      list-style: none;
      display: flex;
      gap: 25px;
      margin: 0;
      padding: 0;
    }

    nav ul li a {
      text-decoration: none;
      color: #fff;
      font-size: 1.1em;
      padding: 8px 15px;
      border-radius: 10px;
      transition: 0.3s;
    }

    nav ul li a:hover {
      background: rgba(241, 196, 15, 0.2);
      color: #f1c40f;
      transform: scale(1.1);
      box-shadow: 0 0 15px #f1c40f55;
    }

    /* للهواتف */
/* للهواتف */
@media (max-width: 768px) {
  nav ul {
    display: none;   /* ✨ خليها تختفي افتراضي */
    flex-direction: column;
    position: absolute;
    top: 70px;
    right: 10px;
    background: rgba(0,0,0,0.95);
    width: 220px;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0,0,0,0.6);
  }

  nav ul.active {
    display: flex;  /* ✨ هتظهر بس لما ندوس ع الزرار */
  }

  .menu-toggle {
    display: block;
    font-size: 2em;
    cursor: pointer;
    color: #242322;
  }
}


    .menu-toggle {
      display: block;
    }
  </style>
</head>
<body>

  <!-- ===== الناف بار ===== -->
<nav>
  <div class="logo">👑 G10 Empire</div>
  <div class="menu-toggle" onclick="toggleMenu()">☰</div>
  <ul id="nav-links">
    <li><a href="#">الرئيسية</a></li>
    <li><a href="/login">تسجيل الدخول</a></li>
    <li><a href="#about">من نحن</a></li>
    <li><a href="#features">المميزات</a></li>
    <li><a href="#achievements">الإنجازات</a></li>
    <li><a href="/contact">تواصل</a></li>
  </ul>
</nav>


  <!-- ===== الهيدر ===== -->
  <header>
    <img src="/logo.jpg" alt="شعار الجروب" style="width: 100px; border-radius: 20%; margin-bottom: 10px;">
    <h1>G10 Empire Giants 👑</h1>
    <p>الأسطورة تبدأ من هنا 💥</p>
  </header>

  <!-- ===== من نحن ===== -->
  <section id="about">
    <h2>من نحن؟</h2>
    <p>نحن جروب G10 Empire Giants 👑، مملكة من الجنون والمرح والإبداع! بنجمع بين الصداقة والمعرفة والمذاكره والضحك في جروب واحد فقط. لو إنت جامد... يبقى ده مكانك!</p>
  </section>

  <!-- ===== المميزات ===== -->
  <section id="features">
    <h2>مميزات الجروب 💎</h2>
    <div class="features">
      <div class="feature">
        <h3>💬 دردشة ممتعة</h3>
        <p>حوارات ليلية، هبد، نقاشات ساخنة، وكل حاجة بينفع تتقال!</p>
      </div>
      <div class="feature">
        <h3>📚 تبادل معلومات</h3>
        <p>معلومات، ميمز تعليمية، حوارات برمجة، وكل ما يفيد دماغك.</p>
      </div>
      <div class="feature">
        <h3>🎉 مسابقات وتحديات</h3>
        <p>مسابقات شهرية وشهادات جامده للفائزين , مين قدنا؟</p>
      </div>
    </div>
  </section>

  <!-- ===== الإنجازات ===== -->
  <section id="achievements">
    <h2>شهادات وإنجازات السنة اللي فاتت 🎓</h2>
    <p>إحنا مش بس بنهزر وندردش، لأ إحنا بننجز كمان! السنة اللي فاتت أعضاء الجروب شاركوا في مسابقات ، وده شوية من اللي حققناه👇</p>

    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-top: 30px;">
      <img src="/salma1.jpeg" alt="شهادة 1" style="width: 250px; border-radius: 8px; box-shadow: 0 0 10px #00000066;">
      <img src="/Zainab.jpeg" alt="شهادة 2" style="width: 250px; border-radius: 8px; box-shadow: 0 0 10px #00000066;">
      <img src="/Aliaa.jpeg" alt="شهادة 3" style="width: 250px; border-radius: 8px; box-shadow: 0 0 10px #00000066;">
      <img src="/Ahd.jpeg" alt="شهادة 4" style="width: 250px; border-radius: 8px; box-shadow: 0 0 10px #00000066;">
      <img src="/Mariam.jpeg" alt="شهادة 5" style="width: 250px; border-radius: 8px; box-shadow: 0 0 10px #00000066;">
    </div>

    <p style="margin-top: 20px; color: #2ecc71; font-weight: bold;">السنة دي دورك! مستنيين نشوف اسمك على الشهادة الجاية 💪</p>
  </section>

  <!-- ===== CTA ===== -->
  <section class="cta">
    <h2>انضم لينا دلوقتي 🔥</h2>
    <a href="https://chat.whatsapp.com/Itw7quzlza1KuzBvhaed79?mode=ems_copy_c" target="_blank">اضغط هنا للانضمام</a>
  </section>

  <!-- ===== تواصل ===== -->
  <a href="/contact" class="Adm">تواصل مع الادمنز</a>

  <!-- ===== الفوتر ===== -->
  <footer>
    &copy; 2025 G10 Empire Giants. كل الحقوق محفوظة 👑
  </footer>

  <script>
    function toggleMenu() {
      document.getElementById("nav-links").classList.toggle("active");
    }
  </script>
</body>
</html>

  `);
});

// ================= صفحة تسجيل الدخول =================
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");

  res.send(`
   <!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>تسجيل الدخول</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: "Poppins", sans-serif;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #f1c40f, #707c64);
    }

    .container {
      width: 100%;
      max-width: 400px;
    }

    .form-box {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      color: #fff;
      text-align: center;
    }

    .form-box h2 {
      margin-bottom: 20px;
      font-size: 28px;
    }

    .input-group {
      position: relative;
      margin: 20px 0;
    }

    .input-group input {
      width: 100%;
      padding: 12px;
      border: none;
      border-bottom: 2px solid #fff;
      background: transparent;
      color: #fff;
      outline: none;
      font-size: 16px;
    }

    .input-group label {
      position: absolute;
      left: 0;
      top: 12px;
      color: #fff;
      font-size: 16px;
      transition: 0.3s ease;
      pointer-events: none;
    }

    .input-group input:focus ~ label,
    .input-group input:valid ~ label {
      top: -10px;
      font-size: 14px;
      color: #00f2fe;
    }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      background: #00f2fe;
      color: #000;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      transition: 0.3s;
    }

    .btn:hover {
      background: #4facfe;
      color: #fff;
    }

    .toggle {
      margin-top: 15px;
      font-size: 14px;
    }

    .toggle a {
      color: #2c5052;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="form-box">
      <h2>تسجيل الدخول</h2>
      <form action="/login" method="POST">
        <div class="input-group">
          <input type="text" name="username" required />
          <label>اسم المستخدم</label>
        </div>
        <div class="input-group">
          <input type="password" name="password" required />
          <label>كلمة المرور</label>
        </div>
        <button type="submit" class="btn">دخول</button>
      </form>
      <p class="toggle">ما عندكش حساب؟ <a href="/register">سجل هنا</a></p>
    </div>
  </div>
</body>
</html>

  `);
});

// ================= صفحة تسجيل مستخدم جديد =================
app.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");

  res.send(`
     <!DOCTYPE html>
    <html lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تسجيل مستخدم جديد</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Poppins", sans-serif; }
        body { display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #f1c40f, #707c64); }
        .container { width: 100%; max-width: 400px; }
        .form-box { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); padding: 30px; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.2); color: #fff; text-align: center; }
        .form-box h2 { margin-bottom: 20px; font-size: 28px; }
        .input-group { position: relative; margin: 20px 0; }
        .input-group input { width: 100%; padding: 12px; border: none; border-bottom: 2px solid #fff; background: transparent; color: #fff; outline: none; font-size: 16px; }
        .input-group label { position: absolute; left: 0; top: 12px; color: #fff; font-size: 16px; transition: 0.3s ease; pointer-events: none; }
        .input-group input:focus ~ label, .input-group input:valid ~ label { top: -10px; font-size: 14px; color: #00f2fe; }
        .btn { width: 100%; padding: 12px; border: none; background: #00f2fe; color: #000; border-radius: 25px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .btn:hover { background: #4facfe; color: #fff; }
        .toggle { margin-top: 15px; font-size: 14px; }
        .toggle a { color: #2c5052; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="form-box">
          <h2>تسجيل مستخدم جديد</h2>
          <form action="/register" method="POST">
            <div class="input-group">
              <input type="text" name="username" required />
              <label>اسم المستخدم</label>
            </div>
            <div class="input-group">
              <input type="password" name="password" required />
              <label>كلمة المرور</label>
            </div>
            <button type="submit" class="btn">تسجيل</button>
          </form>
          <p class="toggle">عندك حساب بالفعل؟ <a href="/login">سجل دخول</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ================= عدد المستخدمين =================
app.get("/usersCount", (req, res) => {
  res.json({ count: users.length });
});

// ================= تشغيل السيرفر =================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
