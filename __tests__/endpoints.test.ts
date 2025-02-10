import { endpoints, bulkEndpointMap } from '../src/config/endpoints';

describe('Endpoints Configuration', () => {
  test('tutti gli endpoint hanno le proprietà richieste', () => {
    Object.entries(endpoints).forEach(([key, config]) => {
      expect(config).toHaveProperty('path');
      expect(config).toHaveProperty('method');
      expect(config).toHaveProperty('handler');
      expect(config).toHaveProperty('supportsBulk');
    });
  });

  test('bulkEndpointMap contiene solo gli endpoint che supportano bulk', () => {
    const supportedEndpoints = Object.entries(endpoints)
      .filter(([_, config]) => config.supportsBulk)
      .map(([key]) => key);

    expect(Object.keys(bulkEndpointMap)).toEqual(supportedEndpoints);
  });
});