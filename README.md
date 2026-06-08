# Developing Predictive Models for Disease Outbreaks Using AI and Big Data

## Overview

This project is an intelligent web-based healthcare platform designed for disease outbreak prediction and personalized health monitoring.

The system combines machine learning, outbreak visualization, AI-powered assistance, and real-time analytics within a unified platform.

## Features

- Disease outbreak prediction using AI models
- Interactive outbreak visualization map
- Health monitoring dashboard
- Multi-agent AI healthcare chatbot
- Real-time alerts and notifications
- Medical article management system
- Role-based access control (Admin/User)
- Statistical outbreak classification using Z-Score

## Technologies Used

### Frontend
- Next.js
- Tailwind CSS
- JavaScript

### Backend
- FastAPI
- Supabase
- PostgreSQL

### Machine Learning
- XGBoost
- LightGBM
- Scikit-learn
- Pandas
- NumPy

### AI Integration
- OpenAI API

### Deployment
- Vercel
- Hugging Face

## Machine Learning Pipeline

1. Data Collection
2. Data Preprocessing
3. Feature Engineering
4. Lag Feature Generation
5. Growth Rate Calculation
6. XGBoost Training
7. LightGBM Training
8. Hybrid Prediction Generation
9. Z-Score Outbreak Classification
10. Visualization and Alert Generation

## Dataset

The model was trained using the Infectious Disease 2001–2014 dataset obtained from Kaggle.

Main features include:

- Disease
- County
- Year
- Count
- Rate

Additional engineered features:

- Lag Features
- Growth Rate
- Temporal Features

## Model Performance

| Model | MSE | RMSE | MAE | R² |
|---------|---------|---------|---------|---------|
| XGBoost | 1507.29 | 38.82 | 4.18 | 0.7724 |
| LightGBM | 719.76 | 26.83 | 3.13 | 0.8913 |
| Hybrid Model | 932.17 | 30.53 | 3.50 | 0.8592 |

## System Architecture

The platform consists of:

- Frontend Layer (Next.js)
- Backend Layer (FastAPI)
- Database Layer (Supabase/PostgreSQL)
- Machine Learning Service
- OpenAI Multi-Agent Chatbot
- Outbreak Detection Module

## Authors

Graduation Project – Department of Information Technology Engineering

## License

Academic Project
