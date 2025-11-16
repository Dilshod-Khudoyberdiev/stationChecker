# **StationChecker**

**StationChecker** is a web application that allows residents of Hamburg to report issues at local train stations. Users can submit reports about broken elevators, escalators, ticket machines, cleanliness problems, or safety risks.
The system supports three roles: **Guest**, **Resident**, and **Admin**.

This project was developed during a **20-week internship (March–July 2025)**.
A fully functional prototype exists; deployment was postponed due to time constraints.

---

## **Features**

### **Guest**

* View all reported problems
* Filter by **station**, **status**, and **search term**

### **Resident**

* Register and log in
* Submit new issues
* Upload photos
* Report anonymously
* View and manage personal reports

### **Admin**

* Access an admin dashboard
* Edit or delete reports
* Update status:

  * `open`, `in_progress`, `resolved`, `duplicate`
* Add moderation comments

---

## **Technology Stack**

### **Frontend**

* HTML
* JavaScript
* Bootstrap 5
* Static web pages

### **Backend**

* C# **.NET 8 Web API**
* EF Core with layered architecture

  * Controllers
  * Services
  * Repositories
* Role-based authentication and authorization

### **Database**

* PostgreSQL 14+
* Normalized schema for:

  * Users
  * Roles
  * Stations
  * Issues
  * Comments
  * File metadata

---

## **Architecture Overview**

```
Frontend (HTML + Bootstrap)
          |
          |  REST API
          |
Backend (.NET 8 Web API)
          |
          |  EF Core ORM
          |
PostgreSQL Database
```

---

## **Database Schema (Summary)**

* **Users** – account data, password hashes
* **Roles** – Resident, Admin
* **UserRoles** – many-to-many mapping
* **Stations** – station metadata
* **Issues** – reported problems
* **Files** – uploaded image metadata
* **Comments** – admin comments
* **IssueStatusHistory** – status change audit logs

---

## **Local Development Setup**

### **Prerequisites**

* .NET SDK **8.x**
* PostgreSQL **14+**
* Git
* (Optional) Static HTTP server

### **Setup Steps**

1. Clone the repository:

   ```bash
   git clone https://github.com/Dilshod-Khudoyberdiev/stationChecker
   ```
2. Create a PostgreSQL database.
3. Run EF Core migrations.
4. Add an admin:

   * Insert a row into `UserRoles` with the Admin role.
5. Configure `appsettings.json`:

   * Database connection string
   * Secrets
   * JWT keys (optional)
6. Start the backend:

   ```bash
   dotnet run
   ```
7. Open the frontend (open `index.html` or serve it).
8. Test the full workflow:

   * Register
   * Log in
   * Submit an issue
   * Check **Meine Meldungen**
   * Use Admin dashboard to moderate

---

## **Known Limitations**

* Not deployed to production
* Basic authentication (no Google OAuth)
* Anonymous reporting reduces traceability
* Photo uploads need stronger validation in production
* Frontend is static (no routing framework)

---

## **Future Improvements**

* Google OAuth login
* Map view + station autocomplete
* WCAG accessibility improvements
* CSV/PDF export for admins
* Extended audit trail
* React-based modular frontend

---

## **Related Repositories**

* **Backend:** [https://github.com/molytix/stationchecker-backend](https://github.com/molytix/stationchecker-backend)
* **Frontend:** [https://github.com/molytix/stationchecker-frontend](https://github.com/molytix/stationchecker-frontend)

---

## **Lessons Learned**

* Designing backend microservices with .NET and PostgreSQL
* Implementing secure role-based authentication
* Importance of correct German UI labels
* Planning database schema and migrations
* File upload and metadata handling
* Clean separation of user roles
* Consistent UI using Bootstrap
* Writing testable REST APIs
* Value of unit and integration testing
* Importance of documentation and time planning
