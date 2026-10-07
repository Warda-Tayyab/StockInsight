/** @module shared/services/userManagementService */

import api from '../utils/api';

const userManagementService = {
  list: () => api.get('/api/users/manage'),
  invite: (payload) => api.post('/api/users/manage/invite', payload),
  resendInvite: (id) => api.post(`/api/users/manage/${id}/resend-invite`),
  update: (id, payload) => api.patch(`/api/users/manage/${id}`, payload),
  remove: (id) => api.delete(`/api/users/manage/${id}`),
};

export default userManagementService;
