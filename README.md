# Developing Predictive Models for Disease Outbreaks Using AI and Big Data

## Overview

HealthSight is an intelligent web-based healthcare platform designed to predict disease outbreaks, monitor public health trends, and provide AI-powered healthcare assistance.

The platform combines machine learning, outbreak visualization, health analytics, and a multi-agent AI chatbot within a unified system to support early outbreak detection and health awareness.

## Live Demo

🔗 https://healthsight-3tsd.vercel.app/

---

## Key Features

### Disease Outbreak Prediction

* Predict future disease outbreaks using Machine Learning models.
* Analyze temporal disease patterns and trends.
* Support early outbreak detection.

### Interactive Outbreak Monitoring

* Interactive outbreak visualization map.
* County-based disease tracking.
* Risk level classification using Z-Score analysis.

### Health Monitoring Dashboard

* Daily health logging.
* Personalized health insights.
* Health score tracking and visualization.

### AI Healthcare Assistant

* Multi-Agent AI chatbot powered by OpenAI.
* General health assistance.
* Nutrition recommendations.
* Mental health support.
* Fitness guidance.

### Alert & Notification System

* Outbreak alerts.
* Location-based notifications.
* Risk monitoring and awareness.

### Administration Panel

* Disease monitoring dashboard.
* User management.
* Article management.
* Prediction monitoring.
* Alert management.

---

## Technologies Used

### Frontend

* Next.js
* Tailwind CSS
* JavaScript

### Backend

* FastAPI
* Supabase
* PostgreSQL

### Machine Learning

* XGBoost
* LightGBM
* Scikit-Learn
* Pandas
* NumPy

### Artificial Intelligence

* OpenAI API
* Multi-Agent Chatbot Architecture

### Deployment

* Vercel
* Hugging Face

---

## Machine Learning Workflow

1. Data Collection
2. Data Preprocessing
3. Feature Engineering
4. Lag Feature Generation
5. Growth Rate Calculation
6. XGBoost Training
7. LightGBM Training
8. Hybrid Ensemble Prediction
9. Z-Score Outbreak Classification
10. Visualization and Alert Generation

---

## Dataset

The system was trained using the Infectious Disease 2001–2014 dataset obtained from Kaggle.

### Main Features

* Disease
* County
* Year
* Count
* Rate

### Engineered Features

* Lag Features
* Growth Rate
* Temporal Features

---

## Model Performance

| Model        | MSE     | RMSE  | MAE  | R²     |
| ------------ | ------- | ----- | ---- | ------ |
| XGBoost      | 1507.29 | 38.82 | 4.18 | 0.7724 |
| LightGBM     | 719.76  | 26.83 | 3.13 | 0.8913 |
| Hybrid Model | 932.17  | 30.53 | 3.50 | 0.8592 |

---

## Outbreak Classification

The platform uses Z-Score analysis to classify outbreak severity:

* Low Risk (Z < 1)
* Medium Risk (1 ≤ Z < 2)
* High Risk (Z ≥ 2)

This enables automated outbreak detection and alert generation.

---

## System Architecture

The platform consists of:

* Frontend Layer (Next.js)
* Backend Layer (FastAPI)
* Database Layer (Supabase / PostgreSQL)
* Machine Learning Layer
* OpenAI Multi-Agent Chatbot
* Outbreak Detection Module
* Notification & Alert System

---

## Sustainable Development Goal

### SDG 3 — Good Health and Well-Being

This project supports the United Nations Sustainable Development Goal 3 by improving disease monitoring, outbreak prediction, and access to healthcare information through AI-powered technologies.

---

## Authors

Graduation Project

Department of Information Technology Engineering

2025–2026
