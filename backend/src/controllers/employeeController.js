import Company from "../models/Company.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";

// Helper to get company with correct context
const getOwnCompany = async (companyId) => {
    const company = await Company.findById(companyId);
    if (!company) throw new Error("Company not found");
    return company;
};

export const createEmployee = async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
        return res.status(403).json({ message: "Admins cannot manage regular employees. Use the Manage Staff portal to manage HR and Managers." });
    }
    const company = await getOwnCompany(req.user.companyId);
    
    const { employeeId, name, email, phoneNumber, department, role, monthlySalary, status, password } = req.body;
    
    // Check for duplicate employeeId within THIS company
    const existing = company.employees.find(emp => emp.employeeId === employeeId);
    if (existing) {
        return res.status(400).json({ message: "Employee ID already exists in your company" });
    }

    // Check for duplicate email within THIS company
    const existingEmail = company.employees.find(emp => emp.email === email.toLowerCase().trim());
    if (existingEmail) {
        return res.status(400).json({ message: "Email already exists in your company" });
    }

    // Check if user already exists in Auth collection
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists in the system" });
    }

    // Generate default password: username@WorkSphere (username = email prefix)
    const username = normalizedEmail.split('@')[0];
    const defaultPassword = `${username}@WorkSphere`;
    const finalPassword = password || defaultPassword;

    console.log(`[CREATE_EMPLOYEE] Email: ${normalizedEmail}, Username: ${username}, DefaultPassword: ${defaultPassword}, FinalPassword: ${finalPassword}, ProvidedPassword: ${password ? "YES" : "NO"}`)

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(finalPassword, salt);
    console.log(`[CREATE_EMPLOYEE] Hashed password starts with: ${hashedPassword.substring(0, 20)}`)

    // 1. Add to Company Employees array
    const newEmployee = {
        employeeId,
        name,
        email: normalizedEmail,
        phoneNumber,
        department,
        role: "EMPLOYEE",
        monthlySalary,
        status: status || "Active"
    };
    company.employees.push(newEmployee);
    await company.save();

    // 2. Create User record for login
    const newUser = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "EMPLOYEE",
        companyId: req.user.companyId
    });
    await newUser.save();

    // 3. Send credentials email to employee
    try {
      const emailSubject = "Welcome to WorkSphere - Your Login Credentials";
      const emailMessage = `Dear ${name},

Welcome to WorkSphere! Your employee account has been created by your HR department.

Your login credentials are:
- Email: ${normalizedEmail}
- Password: ${finalPassword}
- Portal: Employee Portal

Please log in at the WorkSphere Employee Portal and change your password after first login for security.

Best regards,
HR Team
WorkSphere`;

      await sendEmail({
        email: normalizedEmail,
        subject: emailSubject,
        message: emailMessage
      });
    } catch (emailError) {
      console.error("Failed to send credentials email:", emailError);
      // Don't fail the request if email fails
    }
    
    // Return the newly created employee (last one in array)
    const createdEmployee = company.employees[company.employees.length - 1];
    res.status(201).json({
      ...createdEmployee.toObject ? createdEmployee.toObject() : createdEmployee,
      credentialsSent: true,
      defaultPasswordUsed: !password
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, employeeId, department, role, password } = req.body;
    if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ message: "Valid email is required" });
    }
    const normalizedEmail = email.trim();

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only Admins can create HR or Managers" });
    }

    if (!["HR", "MANAGER"].includes(role)) {
        return res.status(400).json({ message: "Only HR or Manager roles can be created here" });
    }

    const company = await getOwnCompany(req.user.companyId);
    
    // Check for duplicate employeeId or email within THIS company
    const existing = company.employees.find(emp => emp.employeeId === employeeId || emp.email === normalizedEmail);
    if (existing) {
        return res.status(400).json({ message: "Employee ID or Email already exists in your company" });
    }

    // Check if user already exists in Auth collection
    const existingUser = await User.findOne({ email: { $eq: normalizedEmail } });
    if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
    }

    // 1. Add to Company Employees array
    company.employees.push({
        employeeId,
        name,
        email: normalizedEmail,
        department,
        role,
        status: "Active"
    });
    await company.save();

    // 2. Create User record for login
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || "WorkSphere@2026", salt);

    const newUser = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        companyId: req.user.companyId
    });
    await newUser.save();
    
    res.status(201).json(company.employees[company.employees.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { department, search } = req.query;
    const company = await Company.findById(req.user.companyId).select('employees');
    
    let employees = company.employees;

    // Filter by department if provided
    if (department) {
      employees = employees.filter(emp => emp.department === department);
    }

    // Filter by search query (name, ID, or email) if provided
    if (search) {
      const query = search.toLowerCase();
      employees = employees.filter(emp => 
        emp.name.toLowerCase().includes(query) || 
        emp.employeeId.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query)
      );
    }
    
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const employee = company.employees.id(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
        return res.status(403).json({ message: "Admins cannot manage regular employees." });
    }
    const company = await Company.findById(req.user.companyId);
    const employee = company.employees.id(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update fields
    Object.assign(employee, req.body);
    await company.save();

    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
        return res.status(403).json({ message: "Admins cannot manage regular employees." });
    }
    const company = await Company.findById(req.user.companyId);
    
    // Remove the employee subdocument
    const employee = company.employees.id(req.params.id);
    if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
    }
    
    employee.deleteOne(); // Mongoose subdocument method
    
    // Also cleanup linked attendance and payrolls within the same document
    company.attendance = company.attendance.filter(att => att.employeeId.toString() !== req.params.id);
    company.payrolls = company.payrolls.filter(pay => pay.employeeId.toString() !== req.params.id);

    await company.save();
    res.json({ message: "Employee and related records deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
