import { useState, useEffect, useCallback } from 'react';
import { failureSimulationService } from '../services/failureSimulationService';
import type {
  FailureScenario,
  FailureScenarioId,
  FailureLogEntry,
  OutboxRetryStep,
} from '../types';

export function useFailureSimulationStore() {
  const [scenarios, setScenarios] = useState<FailureScenario[]>(() =>
    failureSimulationService.getScenarios()
  );
  const [logs, setLogs] = useState<FailureLogEntry[]>(() =>
    failureSimulationService.getLogs()
  );
  const [outboxSteps, setOutboxSteps] = useState<OutboxRetryStep[]>(() =>
    failureSimulationService.getOutboxSteps()
  );
  const [duplicateDemoState, setDuplicateDemoState] = useState(() =>
    failureSimulationService.getDuplicateDemoState()
  );

  useEffect(() => {
    const unsubscribe = failureSimulationService.subscribe(() => {
      setScenarios(failureSimulationService.getScenarios());
      setLogs(failureSimulationService.getLogs());
      setOutboxSteps(failureSimulationService.getOutboxSteps());
      setDuplicateDemoState(failureSimulationService.getDuplicateDemoState());
    });
    return unsubscribe;
  }, []);

  const triggerScenario = useCallback((id: FailureScenarioId) => {
    return failureSimulationService.triggerScenario(id);
  }, []);

  const triggerAllScenarios = useCallback(() => {
    return failureSimulationService.triggerAllScenarios();
  }, []);

  const runOrderServiceDown = useCallback(() => {
    return failureSimulationService.runOrderServiceDown();
  }, []);

  const runDuplicatePurchaseRequest = useCallback(() => {
    return failureSimulationService.runDuplicatePurchaseRequest();
  }, []);

  const runMessageDuplication = useCallback(() => {
    return failureSimulationService.runMessageDuplication();
  }, []);

  const clearLogs = useCallback(() => {
    failureSimulationService.clearLogs();
  }, []);

  const resetAllScenarios = useCallback(() => {
    failureSimulationService.resetAllScenarios();
  }, []);

  return {
    scenarios,
    logs,
    outboxSteps,
    duplicateDemoState,
    triggerScenario,
    triggerAllScenarios,
    runOrderServiceDown,
    runDuplicatePurchaseRequest,
    runMessageDuplication,
    clearLogs,
    resetAllScenarios,
  };
}
