const eventService = require('../services/eventService');

class EventController {
    async getEventsByProject(req, res) {
        try {
            const { projectId } = req.params;
            const events = await eventService.getEventsByProjectId(projectId);
            res.json(events);
        } catch (error) {
            console.error('Error in getEventsByProject:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createEvent(req, res) {
        try {
            const { projectId } = req.params;
            const eventData = { ...req.body, projectId };
            const newEvent = await eventService.addEvent(eventData);
            res.status(201).json(newEvent);
        } catch (error) {
            console.error('Error in createEvent:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const updatedEvent = await eventService.updateEvent(id, req.body);
            res.json(updatedEvent);
        } catch (error) {
            console.error('Error in updateEvent:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            await eventService.deleteEvent(id);
            res.json({ message: 'Event deleted successfully' });
        } catch (error) {
            console.error('Error in deleteEvent:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new EventController();
