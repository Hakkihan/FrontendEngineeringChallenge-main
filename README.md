# Solve Intelligence Engineering Challenge

## Objective

You have received a mock-up of a patent reviewing application from a junior colleague. Unfortunately, it is incomplete and needs additional work. Your job is to take your colleague's work, improve and extend it, and add a feature of your own creation!

## Docker

Make sure you create a .env file (see .env.example) with the OpenAI API key we have provided.

To build and run the application using Docker, execute the following command:

```
docker-compose up --build
```

## Task 1: Implement Document Versioning

Currently, the user can save a document, but there is no concept of **versioning**. Paying customers have expressed an interest in this and have requested the following:

1. The ability to create new versions
2. The ability to switch between existing versions
3. The ability to make changes to any of the existing versions and save those changes (without creating a new version)

You will need to modify the database model (`app/models.py`), add some API routes (`app/__main__.py`), and update the client-side code accordingly.

## Task 2: Real-Time AI Suggestions

Your colleague started some work on integrating real-time improvement suggestions for your users. However, they only had time to set up a WebSocket connection. It is your job to finish it.

You will find a completed WebSocket endpoint in the `app/__main__.py` file in the `server`. This endpoint listens for messages containing the editor contents from the client, and replies with AI-generated suggestions.

You will need to find some way of notifying the user of the suggestions generated. As we don't want the user's experience to be impacted, this should be a background process. You can find the existing frontend WebSocket code in `client/src/Document.tsx`.

**Note**: You should not alter any of the code in `server/app/internal/`.

## Task 3: Showcase your frontend skills

Implement an additional product improvement that would benefit our customers as they draft their patent applications. 

For example:
- Redesigning the UX
- Calculating and displaying diffs 
- Improved editor functionality

This last part is open-ended, and you can take it in any direction you like. We’re interested in seeing how you come up with and implement features without us directing you.

Enjoy!



----------------------------------------------------------------------------------------
My approach to the FrontendEngineeringChallenge-main

Initial startup: I used docker-compose as per the guidance of the instructions to have the frontend and backend running.

1.) Seeing as there is one table called "Documents" on startup with content, I will build upon that by adding another table called "PatentEntity" . PatentEntity will be the core product that is of interest and Documents will be treated as the version instances with a ForeignKey associated with the core product of interest.

2.)