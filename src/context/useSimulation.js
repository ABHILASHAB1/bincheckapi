// Dedicated hook file - separated from SimulationContext.jsx to fix:
// Vite HMR: "Could not Fast Refresh: useSimulation export is incompatible"
// Vite requires files to export ONLY components OR ONLY hooks/utils, not both.
import { useContext } from 'react';
import { SimulationContext } from './SimulationContext';

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
};

export default useSimulation;
