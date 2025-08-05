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

## My Approach to the FrontendEngineeringChallenge-main

### Initial Setup
I used docker-compose as per the guidance of the instructions to have the frontend and backend running.

### Task 1: Document Versioning Implementation

I implemented document versioning by adding a `PatentEntity` table on the server side and establishing a foreign key relationship between documents and patent entities. This approach treats `PatentEntity` as the core product of interest, while `Documents` serve as version instances with a foreign key association to the core product.

**Server-side changes:**
- Added `PatentEntity` model with appropriate fields
- Created foreign key relationship between `Document` and `PatentEntity` models
- Modified API endpoints to handle the new relationship structure

**Frontend modifications:**
- Updated the client-side code to accommodate the new data structure
- Added UI components to manage patent entities and their associated document versions

### Task 2: Real-Time AI Suggestions

I implemented the WebSocket functionality to enable real-time AI suggestions with the following features:

- **Debounced input handling**: 1-second lag after typing stops to avoid excessive API calls
- **Timeout protection**: 10-second timeout to prevent hanging connections
- **Background processing**: AI suggestions are generated without impacting user experience at the bottom of the page
- **Real-time updates**: Suggestions are delivered through the WebSocket connection

The implementation ensures that users receive helpful AI-generated suggestions while maintaining a smooth, uninterrupted editing experience.

### Task 3: Frontend Enhancements

I refactored the codebase and implemented several UI/UX improvements:

**Design System:**
- Integrated shadcn components for consistent UI patterns
- Applied a modern slate-theme color palette throughout the application
- Enhanced overall visual consistency and professional appearance

**New Features:**
- **Collapsible sidebar**: Added collapsible action panel for better space utilization
- **Document save tracking**: Implemented tracking of document save times for better user awareness
- **Logo enhancement**: Added a small 'surprise' element to the logo for a touch of personality

**Code Quality:**
- Refactored existing code for better maintainability and organization
- One very small styling change in `internal/Editor.tsx` to enhance the look and feel (I am happy to remove this if you wish! It was just a one liner about font-style)
- Improved component structure and separation of concerns

I also added some tests where I expedited the process with some AI assistance. 

The enhancements focus on providing a professional, user-friendly experience while maintaining the core functionality of the patent reviewing application.