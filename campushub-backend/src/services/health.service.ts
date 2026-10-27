export interface HealthStatus {
  status: 'ok';
}

export const getHealthStatus = async (): Promise<HealthStatus> => ({
  status: 'ok',
});
