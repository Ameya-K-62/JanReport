# JanReport

### AI-Assisted Local News Reporting & Moderation Platform

JanReport is a full-stack web application designed to enable users to
submit, review, moderate, and explore local news reports.

The platform combines a modern React frontend with a Node.js/Express
backend, MongoDB-based data management, AI-assisted content analysis,
OCR-based information extraction, location-based visualization, and
moderation workflows.

---

## 🚀 Project Overview

Local news often originates from community members who directly
experience incidents such as traffic disruptions, infrastructure
problems, accidents, environmental issues, and public-safety events.

JanReport provides a centralized platform where users can submit
local reports while moderators can review and manage submitted content.

The system also provides AI-assisted analysis to help users and
moderators understand news content through:

- AI-generated news insights
- AI-assisted authenticity assessment
- Sentiment analysis
- Incident severity estimation
- OCR-based information extraction
- Location and map visualization
- Analytics dashboards

> **Note:** AI-based authenticity results are intended as
> decision-support features and should not be treated as definitive
> fact-checking or journalistic verification.

---

## ✨ Key Features

### 📰 Local News Reporting

- Submit local news reports
- Add title, description, category, and location
- Upload supporting images
- View published reports
- View personal submissions
- Track report status

### 🔐 Authentication & User Management

- User registration and login
- JWT-based authentication
- User and moderator roles
- Protected backend routes
- Secure password hashing using bcrypt
- Automatic removal of passwords from user JSON responses

### 🛡️ Moderation System

- Dedicated moderation dashboard
- Review submitted reports
- Approve or reject reports
- Add moderator feedback
- Track report status
- Email notifications for approval/rejection

### 🤖 AI-Assisted News Analysis

JanReport integrates AI services to provide:

- AI-generated explanations and insights
- AI-assisted news authenticity assessment
- Scam/viral-message pattern detection
- Natural language processing
- Sentiment analysis
- Incident severity estimation

### 🧠 NLP & Sentiment Analysis

The platform uses a pretrained DistilBERT sentiment model through
Hugging Face inference services.

The analysis provides:

- Positive / negative sentiment
- Confidence score
- Incident severity estimation
- Severity levels: Low, Medium, High

Incident severity combines sentiment information with
incident-related textual cues.

### 📷 OCR & Geotag Extraction

The platform supports OCR-based image processing.

It can:

- Extract text from uploaded images
- Process geotag-related text
- Identify latitude and longitude values
- Return extracted information to the application

### 🗺️ Location-Based News

Reports can contain geographic information and can be visualized
on an interactive map.

The application includes:

- Location-based reports
- Latitude and longitude handling
- Interactive map visualization
- Geocoding support through OpenStreetMap Nominatim

### 📊 Analytics Dashboard

The application provides an analytics interface for viewing
news/report-related information and visualizations.

Charts are implemented using Recharts.

### ☁️ Media Management

Uploaded images can be integrated with Cloudinary for cloud-based
media storage and delivery.

### 📧 Email Notifications

The backend supports automated email notifications for:

- Approved reports
- Rejected reports
- Moderator feedback

---
