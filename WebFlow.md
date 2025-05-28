# AI-Powered Task Management Web Application
## Project Specification & Development Guide

---

## 1. Project Overview

### 1.1 Application Purpose
A modern, AI-powered task management web application designed for multi-location operations (EU, USA, IL). The application serves as a centralized hub for task information with intelligent assistance capabilities powered by local LLM integration.

### 1.2 Core Objectives
- Centralize task management across multiple global locations
- Provide AI-powered assistance for task queries and analysis
- Enable mobile-responsive access for field operations
- Maintain clean, modern, monochrome UI with excellent UX
- Implement role-based access control for data managers

---

## 2. System Architecture

### 2.1 Technology Stack
**Frontend:**
- React.js or Vue.js (recommended for modern UI components)
- Tailwind CSS or similar utility-first CSS framework
- Progressive Web App (PWA) capabilities for mobile optimization
- Responsive design framework

**Backend:**
- Node.js with Express.js or Python with Flask/FastAPI
- JSON file-based data storage system
- RESTful API architecture
- JWT-based authentication

**AI Integration:**
- Local LM Studio integration via HTTP API
- Image processing capabilities
- Text embedding and semantic search
- Real-time chat interface

### 2.2 Data Storage Structure
```json
{
  "tasks": [
    {
      "id": "unique_task_id",
      "title": "Task Title",
      "type": "Task Type",
      "labels": ["label1", "label2"],
      "illumination": "lighting_conditions",
      "weather": "weather_conditions",
      "roadType": "road_classification",
      "project": "project_name",
      "targetCar": "vehicle_model",
      "location": "country_code",
      "priority": "high|medium|low",
      "extraSensor": "sensor_details",
      "datacoNumber": "DATACO-XXXXX",
      "executionDetails": "detailed_instructions",
      "executionLocation": "specific_location_info",
      "exampleImages": ["image_url1", "image_url2"],
      "additionalInfo": "extra_details",
      "status": "active|paused|completed",
      "createdBy": "data_manager_id",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "users": [
    {
      "id": "user_id",
      "username": "username",
      "email": "email",
      "role": "data_manager|viewer",
      "location": "EU|USA|IL",
      "hashedPassword": "hashed_password",
      "createdAt": "timestamp"
    }
  ],
  "locations": [
    {
      "code": "EU|USA|IL",
      "name": "Location Name",
      "dataManager": "user_id",
      "taskCount": "number"
    }
  ]
}
```

---

## 3. User Interface Design

### 3.1 Design Principles
- **Monochrome Color Scheme**: Primary grayscale palette with single accent color
- **Modern Minimalism**: Clean lines, ample whitespace, focused content
- **Mobile-First**: Responsive design optimized for mobile usage
- **Accessibility**: WCAG 2.1 AA compliance
- **Fast Loading**: Optimized performance for field usage

### 3.2 UI Components Specification

#### Header Component
- Company logo/title
- Location selector dropdown
- User profile menu
- AI chat toggle button

#### Task Cards
- Collapsed state: Title, Priority indicator, Location, Status
- Expanded state: All task details, images, execution instructions
- Smooth expand/collapse animations
- Priority color coding (subtle)

#### AI Chat Interface
- Floating chat bubble (bottom-right corner)
- Clean chat interface with message history
- Image upload capability
- Typing indicators and loading states

#### Dashboard (Data Managers Only)
- Task creation/editing forms
- User management
- System statistics
- Data export/import tools

### 3.3 Responsive Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

---

## 4. Feature Specifications

### 4.1 Core Features

#### Task Management
- **View Tasks**: Collapsible card layout with filtering options
- **Task Details**: Comprehensive information display
- **Search & Filter**: By location, priority, type, status
- **Real-time Updates**: Automatic refresh of task data

#### AI Assistant Features
- **Text Queries**: Natural language task searches
  - "Which tasks can I do with Car8 vehicle?"
  - "What are the most important tasks?"
  - "Show me tasks in rainy weather conditions"
- **Image Analysis**: Upload images for task matching
  - Analyze uploaded images against task requirements
  - Suggest relevant tasks based on image content
- **Context-Aware Responses**: Understand user location and preferences

#### Data Manager Features
- **Task CRUD Operations**: Create, Read, Update, Delete tasks
- **Task Status Management**: Active, Paused, Completed
- **Bulk Operations**: Import/export task data
- **User Management**: Add/remove users, assign roles

### 4.2 AI Integration Specifications

#### LM Studio Integration
```javascript
// Example API integration structure
const AI_CONFIG = {
  baseURL: 'http://localhost:1234', // LM Studio default
  endpoints: {
    textCompletion: '/v1/completions',
    imageAnalysis: '/v1/vision/analyze',
    embedding: '/v1/embeddings'
  }
}
```

#### AI Capabilities Required
- **Text Understanding**: Process natural language queries about tasks
- **Image Recognition**: Analyze uploaded images for content matching
- **Semantic Search**: Find relevant tasks based on context
- **Response Generation**: Provide helpful, contextual responses

---

## 5. Technical Implementation

### 5.1 API Endpoints

#### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/verify
```

#### Tasks
```
GET /api/tasks - Retrieve all tasks
GET /api/tasks/:id - Get specific task
POST /api/tasks - Create new task (data managers only)
PUT /api/tasks/:id - Update task (data managers only)
DELETE /api/tasks/:id - Delete task (data managers only)
GET /api/tasks/search?q={query} - Search tasks
```

#### AI Assistant
```
POST /api/ai/chat - Send text query
POST /api/ai/analyze-image - Upload and analyze image
GET /api/ai/suggestions - Get task suggestions
```

#### Admin/Dashboard
```
GET /api/admin/users - User management
POST /api/admin/users - Create user
GET /api/admin/stats - System statistics
POST /api/admin/import - Import data
GET /api/admin/export - Export data
```

### 5.2 Security Requirements

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing (bcrypt)
- Session management

#### Data Protection
- Input validation and sanitization
- XSS protection
- CSRF protection
- Rate limiting for API endpoints

### 5.3 Performance Requirements
- Page load time: < 2 seconds
- API response time: < 500ms
- Mobile optimization: 90+ Lighthouse score
- Offline capability: Basic task viewing

---

## 6. Development Phases

### Phase 1: Foundation (Week 1-2)
- Set up development environment
- Implement basic UI framework
- Create JSON data structure
- Basic authentication system

### Phase 2: Core Features (Week 3-4)
- Task display and management
- User interface implementation
- Basic search and filtering
- Data manager dashboard

### Phase 3: AI Integration (Week 5-6)
- LM Studio API integration
- AI chat interface
- Image upload and analysis
- Natural language query processing

### Phase 4: Enhancement & Testing (Week 7-8)
- UI/UX refinements
- Performance optimization
- Security testing
- Mobile optimization
- User acceptance testing

---

## 7. File Structure

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskCard.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── server.js
│   ├── data/
│   │   ├── tasks.json
│   │   └── users.json
│   └── package.json
├── docs/
└── README.md
```

---

## 8. Testing Strategy

### 8.1 Testing Types
- **Unit Testing**: Component and function level testing
- **Integration Testing**: API and database integration
- **E2E Testing**: Full user workflow testing
- **AI Testing**: LLM response accuracy and reliability
- **Performance Testing**: Load and stress testing
- **Security Testing**: Vulnerability assessment

### 8.2 Testing Tools
- Frontend: Jest, React Testing Library, Cypress
- Backend: Jest, Supertest
- Performance: Lighthouse, WebPageTest
- Security: OWASP ZAP

---

## 9. Deployment & Infrastructure

### 9.1 Deployment Strategy
- **Development**: Local development servers
- **Staging**: Cloud-based staging environment
- **Production**: Scalable cloud deployment
- **LM Studio**: Local installation on designated machines

### 9.2 Environment Configuration
```javascript
// Environment variables
const config = {
  development: {
    API_URL: 'http://localhost:3000',
    LM_STUDIO_URL: 'http://localhost:1234'
  },
  production: {
    API_URL: 'https://api.taskmanager.company.com',
    LM_STUDIO_URL: 'http://internal-lm-studio:1234'
  }
}
```

---

## 10. Maintenance & Support

### 10.1 Monitoring
- Application performance monitoring
- Error tracking and logging
- User activity analytics
- AI model performance metrics

### 10.2 Backup Strategy
- Regular JSON data backups
- Version control for code
- User data export capabilities
- Disaster recovery procedures

---

## 11. Future Enhancements

### 11.1 Planned Features
- Multi-language support
- Advanced analytics dashboard
- Mobile app development
- Integration with external systems
- Enhanced AI capabilities
- Real-time collaboration features

### 11.2 Scalability Considerations
- Database migration path (from JSON to SQL)
- Microservices architecture
- Load balancing strategies
- Caching implementation

---

## 12. Development Guidelines

### 12.1 Code Standards
- ESLint configuration for JavaScript/TypeScript
- Prettier for code formatting
- Consistent naming conventions
- Comprehensive documentation
- Git workflow with feature branches

### 12.2 Documentation Requirements
- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- User manual
- Administrator guide
- Deployment instructions

---

This specification provides a comprehensive foundation for developing your AI-powered task management application. The development team should review each section thoroughly and ask for clarification on any specific requirements before beginning implementation.

2025-05-28 16:37:02 [INFO]
[LM STUDIO SERVER] Supported endpoints:
2025-05-28 16:37:02 [INFO]
[LM STUDIO SERVER] -> GET http://192.168.5.9:1234/v1/models
2025-05-28 16:37:02 [INFO]
[LM STUDIO SERVER] -> POST http://192.168.5.9:1234/v1/chat/completions
2025-05-28 16:37:02 [INFO]
[LM STUDIO SERVER] -> POST http://192.168.5.9:1234/v1/completions
2025-05-28 16:37:02 [INFO]
[LM STUDIO SERVER] -> POST http://192.168.5.9:1234/v1/embeddings