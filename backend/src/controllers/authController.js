import User from "../models/userModel.js"
import Company from "../models/Company.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const searchEmail = email.toLowerCase().trim()
    console.log(`[AUTH] Searching for user: ${searchEmail}`)
    const user = await User.findOne({ email: searchEmail })
    
    if (!user) {
      console.warn(`[AUTH] User not found: ${searchEmail}`)
      return res.status(400).json({ message: "User not found" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" })

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      token,
      role: user.role,
      name: user.name,
      companyId: user.companyId
    })

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}


export const organizationSignup = async (req, res) => {
  const { companyName, name, email, password } = req.body

  try {
    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (typeof companyName !== "string") {
      return res.status(400).json({ message: "Invalid company name" })
    }
    const normalizedCompanyName = companyName.trim()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" })
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ name: { $eq: normalizedCompanyName } })
    if (existingCompany) {
      return res.status(400).json({ message: "Company name already registered" })
    }

// 1. Create Company with Pending status
    const newCompany = new Company({
      name: normalizedCompanyName,
      email: normalizedEmail,
      adminName: name,
      status: "Pending"
    })
    await newCompany.save()

    // 2. Create Admin User
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newAdmin = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
      companyId: newCompany._id
    })
    await newAdmin.save()

    res.status(201).json({ 
      success: true, 
      message: "Organization registered successfully! You can now log in.",
      data: {
        company: newCompany.name,
        admin: newAdmin.name
      }
    })

  } catch (err) {
    console.error("Org Signup Error:", err)
    res.status(500).json({ message: err.message })
  }
}

