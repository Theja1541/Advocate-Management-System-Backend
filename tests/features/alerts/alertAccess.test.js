const alertService = require('../../../src/features/alerts/alertService');
const alertEngine = require('../../../src/features/alerts/alertEngine');
const Alert = require('../../../src/features/alerts/Alert');
const auditService = require('../../../src/features/acts/auditService');
const authService = require('../../../src/services/authService');
const AppError = require('../../../src/utils/AppError');

jest.mock('../../../src/features/alerts/Alert');
jest.mock('../../../src/features/acts/auditService');
jest.mock('../../../src/services/authService');

describe('Alert RBAC and Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { role: 'Staff', id: 1, email: 'staff@example.com' };
  const mockReq = { user: mockUser };

  describe('getAllAlerts', () => {
    it('should filter alerts based on user permissions', async () => {
      // Mock authService to return only 'cases' and 'tasks' modules
      authService.getAuthorizedModules.mockResolvedValue(['cases', 'tasks']);
      
      Alert.findAll.mockResolvedValue([{ get: () => ({ id: 1, referenceType: 'Case' }) }]);
      
      const result = await alertService.getAllAlerts({}, mockReq);
      
      expect(authService.getAuthorizedModules).toHaveBeenCalledWith('Staff', 'V');
      expect(Alert.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          referenceType: { [Symbol.for('in')]: ['Case', 'Hearing', 'Task'] } // Case/Hearing map to cases, Task maps to tasks
        })
      }));
      expect(result).toHaveLength(1);
    });

    it('should return empty list if user has no permissions', async () => {
      authService.getAuthorizedModules.mockResolvedValue([]);
      
      Alert.findAll.mockResolvedValue([]);
      
      const result = await alertService.getAllAlerts({}, mockReq);
      
      expect(Alert.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          referenceType: 'NONE_ALLOWED'
        })
      }));
    });
  });

  describe('resolveAlertStatus', () => {
    const mockAlert = { id: 10, referenceType: 'Payment', status: 'active', save: jest.fn(), alertType: 'PAYMENT_DUE' };

    it('should resolve alert if user has E permission on parent module', async () => {
      Alert.findByPk.mockResolvedValue(mockAlert);
      authService.checkPermission.mockResolvedValue(true); // User has Edit access
      
      await alertService.resolveAlertStatus(10, 'resolved', mockReq);
      
      expect(authService.checkPermission).toHaveBeenCalledWith('Staff', 'pay', 'E');
      expect(mockAlert.save).toHaveBeenCalled();
      expect(auditService.logEvent).toHaveBeenCalledWith(
        auditService.actions.ALERT_RESOLVED,
        mockReq,
        expect.objectContaining({ alertId: 10, status: 'resolved' })
      );
    });

    it('should throw 403 if user lacks E permission on parent module', async () => {
      Alert.findByPk.mockResolvedValue(mockAlert);
      authService.checkPermission.mockResolvedValue(false); // No Edit access
      
      await expect(alertService.resolveAlertStatus(10, 'resolved', mockReq))
        .rejects.toThrow(AppError);
        
      expect(mockAlert.save).not.toHaveBeenCalled();
      expect(auditService.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('AlertEngine Audit Logging', () => {
    it('should log SYSTEM actor when generating alerts', async () => {
      Alert.findOne.mockResolvedValue(null);
      Alert.create.mockResolvedValue({ id: 99, referenceType: 'Task', alertType: 'TASK_OVERDUE' });
      
      await alertEngine.upsertAlert({ referenceType: 'Task', referenceId: 5, alertType: 'TASK_OVERDUE' });
      
      expect(auditService.logEvent).toHaveBeenCalledWith(
        auditService.actions.ALERT_GENERATED,
        'SYSTEM',
        expect.objectContaining({ alertId: 99, alertType: 'TASK_OVERDUE' })
      );
    });
  });
});
