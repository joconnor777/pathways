import React, { FC, ReactNode, useState, RefObject } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { Service } from 'pathways-objects';
import { Pathway, EvaluatedPathway, PreconditionResult } from 'pathways-model';

import styles from './PathwaysList.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Graph from 'components/Graph';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { usePathwayContext } from 'components/PathwayProvider';
import { evaluatePathwayPreconditions } from 'engine';
import { usePatientRecords } from 'components/PatientRecordsProvider';
import { getAssignedPathways } from 'utils/fhirUtils';
import {
  faEye,
  faPlay,
  faPlus,
  faMinus,
  faChevronUp,
  faChevronDown,
  faCaretDown,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@material-ui/core';

const useStyles = makeStyles(
  theme => ({
    'pathway-element': {
      backgroundColor: theme.palette.background.default
    },
    'assigned-pathway-element': {
      backgroundColor: theme.palette.primary.main
    },
    title: {
      color: theme.palette.text.primary
    },
    'assigned-title': {
      color: theme.palette.common.white
    }
  }),
  { name: 'PathwaysList' }
);

interface PathwaysListElementProps {
  evaluatedPathway: EvaluatedPathway;
  preconditions?: PreconditionResult;
  callback: Function;
  assigned: boolean;
}

interface PathwaysListProps {
  evaluatedPathways: EvaluatedPathway[];
  callback: Function;
  service: Service<Array<Pathway>>;
  headerElement: RefObject<HTMLDivElement>;
}

const PathwaysList: FC<PathwaysListProps> = ({
  evaluatedPathways,
  callback,
  service,
  headerElement
}) => {
  const { patientRecords } = usePatientRecords();
  const [preconditions, setPreconditions] = useState<PreconditionResult[] | null>(null);

  if (
    !preconditions &&
    evaluatedPathways.length > 0 &&
    patientRecords &&
    patientRecords.length > 0
  ) {
    // Create a Bundle for the CQL engine and check if patientPath needs to be evaluated
    const patient = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: patientRecords.map((r: fhir.Resource) => ({ resource: r }))
    };

    // Evaluate pathway preconditions for each pathway
    const preconditionPromises = evaluatedPathways.map(pathway =>
      evaluatePathwayPreconditions(patient, pathway.pathway)
    );
    Promise.all(preconditionPromises).then(preconditionResults => {
      setPreconditions(preconditionResults.sort((a, b) => b.matches - a.matches));
    });
  }

  function renderList(): ReactNode {
    return (
      <div>
        {preconditions ? (
          preconditions.map(c => {
            const evaluatedPathway = evaluatedPathways.find(p => p.pathway.name === c.pathwayName);
            if (evaluatedPathway) {
              const pathwayName = evaluatedPathway.pathway.name;
              return (
                <PathwaysListElement
                  evaluatedPathway={evaluatedPathway}
                  callback={callback}
                  preconditions={c}
                  assigned={assignedPathways.includes(pathwayName)}
                  key={pathwayName}
                />
              );
            } else
              return (
                <div>An error occured evaluating the pathway preconditions. Please try again.</div>
              );
          })
        ) : (
          <div>Loading Pathways...</div>
        )}
      </div>
    );
  }

  const assignedPathways = getAssignedPathways(patientRecords, evaluatedPathways);
  const style = { height: '100%' };
  if (headerElement?.current) {
    style.height = window.innerHeight - headerElement.current.clientHeight + 'px';
  }
  return (
    <div className={styles.pathways_list} style={style}>
      {service.status === 'loading' ? (
        <div>Loading...</div>
      ) : service.status === 'loaded' ? (
        <div className={styles.container}>
          <div className={styles.pathwayListHeaderContainer}>
            <div className={styles.header_title}>
              <div className={styles.header_title__header}>Explore Pathways</div>
              <div className={styles.header_title__note}>Select pathway below to view details</div>
            </div>
            <div className={styles.matchedElementsLabel}>
              <i>
                mCODE
                <br />
                elements
                <br />
                matched
              </i>
              <FontAwesomeIcon icon={faCaretDown} />
            </div>
          </div>

          {preconditions?.length !== 0 && renderList()}
        </div>
      ) : (
        <div>ERROR</div>
      )}
    </div>
  );
};

const PathwaysListElement: FC<PathwaysListElementProps> = ({
  evaluatedPathway,
  preconditions,
  callback,
  assigned
}) => {
  const classes = useStyles();
  const pathway = evaluatedPathway.pathway;
  const { setEvaluatedPathway, assignPathway, unassignPathway } = usePathwayContext();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const chevron: IconProp = isVisible ? faChevronUp : faChevronDown;

  function toggleVisible(): void {
    setIsVisible(!isVisible);
  }

  const pathwayElementClass = clsx(
    assigned && styles.assignedPathwayElement,
    assigned && classes['assigned-pathway-element'],
    !assigned && styles.pathwayElement,
    !assigned && classes['pathway-element']
  );

  const titleClass = clsx(
    styles.title,
    assigned && classes['assigned-title'],
    !assigned && classes.title
  );

  return (
    <div className={pathwayElementClass} role={'list'} key={pathway.name}>
      <div
        className={titleClass}
        role={'listitem'}
        onClick={(e): void => {
          setEvaluatedPathway(evaluatedPathway, true);
          toggleVisible();
        }}
      >
        <div>{pathway.name}</div>
        {assigned && <FontAwesomeIcon icon={faCheckCircle} />}
        <div className={styles.expand}>
          <FontAwesomeIcon icon={chevron} />
        </div>
        <div className={styles.numElements}>{preconditions?.matches}</div>
      </div>

      {isVisible && (
        <div className={styles.infoContainer}>
          <div className={styles.details}>
            <p>{pathway.description}</p>
            <table>
              <tbody>
                <tr>
                  <th></th>
                  <th>mCODE elements</th>
                  <th>patient elements</th>
                </tr>
                {preconditions?.preconditionResultItems.map(c => (
                  <tr key={c.elementName}>
                    <td>{c.elementName}</td>
                    <td>{c.expected}</td>
                    <td className={c.match ? styles.matchingElement : undefined}>{c.actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              onClick={(): void => {
                assigned ? unassignPathway(pathway.name) : assignPathway(pathway.name);
              }}
              variant="contained"
              color={assigned ? 'secondary' : 'primary'}
              startIcon={<FontAwesomeIcon icon={assigned ? faTimesCircle : faCheckCircle} />}
            >
              {assigned ? 'Unassign' : 'Assign'}
            </Button>
            <Button
              onClick={(): void => {
                callback(evaluatedPathway);
              }}
              variant="contained"
              color="primary"
              startIcon={<FontAwesomeIcon icon={faEye} />}
            >
              View
            </Button>
          </div>
          <div className={styles.pathway}>
            <div style={{ height: '100%', overflow: 'scroll' }}>
              <Graph
                evaluatedPathway={evaluatedPathway}
                interactive={false}
                expandCurrentNode={false}
              />
            </div>
            <div className={styles.controls}>
              <FontAwesomeIcon icon={faPlay} />
              <FontAwesomeIcon icon={faPlus} />
              <FontAwesomeIcon icon={faMinus} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathwaysList;
