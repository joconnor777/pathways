import React, { FC, useState, useEffect } from 'react';
import Header from 'components/Header';
import Navigation from 'components/Navigation';
import { PathwaysClient } from 'pathways-client';
import logo from 'camino-logo-dark.png';
import { getPatientRecord } from 'utils/fhirExtract';
import { FHIRClientProvider } from './FHIRClient';
import { PatientProvider } from './PatientProvider';
import { PatientRecordsProvider } from './PatientRecordsProvider';
import PatientRecord from './PatientRecord/PatientRecord';
import Graph from './Graph';
import config from 'utils/ConfigManager';
import PathwaysList from './PathwaysList';
import { PathwayProvider } from './PathwayProvider';
import { EvaluatedPathway } from 'pathways-model';
import useGetPathwaysService from './PathwaysService/PathwaysService';
import FHIR from 'fhirclient';
import demoRecords from 'fixtures/MaureenMcodeDemoPatientRecords.json';
import { MockedFHIRClient } from 'utils/MockedFHIRClient';

interface AppProps {
  demo: boolean;
}

const App: FC<AppProps> = ({ demo }) => {
  const [patientRecords, setPatientRecords] = useState<fhir.DomainResource[]>([]);
  const [currentPathway, setCurrentPathway] = useState<EvaluatedPathway | null>(null);
  const [selectPathway, setSelectPathway] = useState<boolean>(true);
  const [evaluatedPathways, setEvaluatedPathways] = useState<EvaluatedPathway[]>([]);
  const [client, setClient] = useState<PathwaysClient | null>(null);

  useEffect(() => {
    if (!demo) {
      FHIR.oauth2
        .init({
          clientId: 'Input client id you get when you register the app',
          scope: 'launch/patient openid profile'
        })
        .then(client => {
          // TODO: MockedFHIRClient has not mocked out requests for resources yet
          getPatientRecord(client).then((records: fhir.DomainResource[]) => {
            // filters out values that are empty
            // the server might return deleted
            // resources that only include an
            // id, meta, and resourceType
            const values = ['id', 'meta', 'resourceType'];
            records = records.filter(resource => {
              return !Object.keys(resource).every(value => values.includes(value));
            });

            setPatientRecords(records);
          });
          setClient(client);
        });
    } else {
      setClient(new MockedFHIRClient());
      setPatientRecords(demoRecords);
    }
  }, [demo]);

  const service = useGetPathwaysService(
    config.get(demo ? 'demoPathwaysService' : 'pathwaysService')
  );

  useEffect(() => {
    if (service.status === 'loaded' && evaluatedPathways.length === 0)
      setEvaluatedPathways(
        service.payload.map(pathway => ({ pathway: pathway, pathwayResults: null }))
      );
  }, [service, evaluatedPathways.length, client, patientRecords]);

  function setEvaluatedPathwayCallback(
    value: EvaluatedPathway | null,
    selectPathway = false
  ): void {
    window.scrollTo(0, 0);
    setSelectPathway(selectPathway);
    setCurrentPathway(value);
  }

  function updateEvaluatedPathways(value: EvaluatedPathway): void {
    const newList = [...evaluatedPathways]; // Create a shallow copy of list
    for (let i = 0; i < evaluatedPathways.length; i++) {
      if (evaluatedPathways[i].pathway.name === value.pathway.name) {
        newList[i] = value;
        setEvaluatedPathways(newList);
      }
    }

    if (currentPathway?.pathway.name === value.pathway.name) {
      setCurrentPathway(value);
    }
  }

  interface PatientViewProps {
    evaluatedPathway: EvaluatedPathway | null;
  }

  const PatientView: FC<PatientViewProps> = ({ evaluatedPathway }) => {
    return (
      <div>
        {evaluatedPathway ? (
          <Graph
            evaluatedPathway={evaluatedPathway}
            expandCurrentNode={true}
            updateEvaluatedPathways={updateEvaluatedPathways}
          />
        ) : (
          <div>No Pathway Loaded</div>
        )}
        <PatientRecord />
      </div>
    );
  };

  return (
    <FHIRClientProvider client={client as PathwaysClient}>
      <PatientProvider
        patient={
          demo ? (demoRecords.find(r => r.resourceType === 'Patient') as fhir.Patient) : null
        }
      >
        <PatientRecordsProvider value={{ patientRecords, setPatientRecords }}>
          <PathwayProvider
            pathwayCtx={{
              updateEvaluatedPathways,
              evaluatedPathway: currentPathway,
              setEvaluatedPathway: setEvaluatedPathwayCallback
            }}
          >
            <div>
              <Header logo={logo} />
              <Navigation
                evaluatedPathways={evaluatedPathways}
                selectPathway={selectPathway}
                setSelectPathway={setSelectPathway}
              />
            </div>
            {selectPathway ? (
              <PathwaysList
                evaluatedPathways={evaluatedPathways}
                callback={setEvaluatedPathwayCallback}
                service={service}
              ></PathwaysList>
            ) : (
              <PatientView evaluatedPathway={currentPathway} />
            )}
          </PathwayProvider>
        </PatientRecordsProvider>
      </PatientProvider>
    </FHIRClientProvider>
  );
};

export default App;
