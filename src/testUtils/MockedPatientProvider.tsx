import React, { FC, ReactNode } from 'react';
import { PatientContext } from 'components/PatientProvider';

interface PatientProviderProps {
  children: ReactNode;
  patient?: fhir.Patient; // fhir.Patient | null;
}

export const mockedPatient = {
  name: [{ given: ['Jane'], family: 'Doe' }],
  birthDate: '1960-04-01',
  gender: 'female',
  address: [
    {
      state: 'AnyState',
      city: 'AnyCity'
    }
  ]
};

const MockedPatientProvider: FC<PatientProviderProps> = ({ patient = null, children }) => (
  <PatientContext.Provider value={patient || mockedPatient}>{children}</PatientContext.Provider>
);

export default MockedPatientProvider;
