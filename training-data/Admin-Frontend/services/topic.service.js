// AdminFE/services/topic.service.js
import api from './api';

const getAllTopics = () => {
    return api.get('/admin/topics');
};

const createTopic = (topicData) => {
    return api.post('/admin/topics', topicData);
};

const updateTopic = (id, topicData) => {
    return api.put(`/admin/topics/${id}`, topicData);
};

const deleteTopic = (id) => {
    return api.delete(`/admin/topics/${id}`);
};

const updateTopicOrder = (topics) => {
    return api.put('/admin/topics/update-order', { topics });
};

const topicService = {
    getAllTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    updateTopicOrder,
};

export default topicService;