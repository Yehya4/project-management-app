const eventService = require('../services/eventService');

class EventController {
    async getEventsByProject(req, res) {
        try {
            const { projectId } = req.params;
            const events = await eventService.getEventsByProjectId(projectId);
            return res.json(events);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createEvent(req, res) {
        try {
            const { projectId } = req.params;
            const eventData = { ...req.body, projectId };
            const newEvent = await eventService.addEvent(eventData);
            return res.status(201).json(newEvent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const updatedEvent = await eventService.updateEvent(id, req.body);
            return res.json(updatedEvent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            await eventService.deleteEvent(id);
            return res.json({ message: 'Event deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async restoreEvent(req, res) {
        try {
            const { id } = req.params;
            await eventService.restoreEvent(id);
            return res.json({ message: 'Event restored successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new EventController();
