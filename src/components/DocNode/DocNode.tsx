import React, { FC, ReactNode, ReactElement, useState } from 'react';
import { GuidanceState, DocumentationResource, State } from 'pathways-model';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import classes from './DocNode.module.scss';
import indexClasses from 'styles/index.module.scss';

interface DocNodeProps {
  pathwayState: GuidanceState | State;
  isActionable: boolean;
  documentation: DocumentationResource | undefined;
  isGuidance: boolean;
}

const DocNode: FC<DocNodeProps> = ({ pathwayState, isActionable, documentation, isGuidance }) => {
  const [comments, setComments] = useState<string>('');

  const defaultText =
    `The patient and I discussed the treatment plan, ` +
    `risks, benefits and alternatives.  The patient ` +
    `expressed understanding and wants to proceed.`;
  let fhirFields: ReactElement[] = [];
  if (documentation?.resource) {
    fhirFields = parseResource(documentation.resource);
  }

  return (
    <div className={indexClasses.docNode}>
      <table className={classes.infoTable}>
        <tbody>
          {isGuidance && <DocGuidance key="rec" pathwayState={pathwayState as GuidanceState} />}
          {fhirFields}
        </tbody>
      </table>
      {isActionable && (
        <form className={classes.commentsForm}>
          <label>Comments:</label>
          <button
            className={indexClasses.button}
            onClick={(e): void => {
              e.preventDefault();
              if (!comments.includes(defaultText)) setComments(comments + defaultText);
            }}
          >
            Use Default Text
          </button>
          <textarea
            className={classes.comments}
            value={comments}
            onChange={(e): void => setComments(e.target.value)}
          ></textarea>
          <button
            className={`${classes.accept} ${indexClasses.button}`}
            onClick={(e): void => e.preventDefault()}
          >
            Accept
          </button>
          <button
            className={`${classes.decline} ${indexClasses.button}`}
            onClick={(e): void => e.preventDefault()}
          >
            Decline
          </button>
        </form>
      )}
    </div>
  );
};

type DocNodeFieldProps = {
  title: string;
  description: ReactNode;
};

const DocNodeField: FC<DocNodeFieldProps> = ({ title, description }) => {
  return (
    <tr>
      <td className={classes.descTitle}>{title}</td>
      <td className={classes.desc}>{description}</td>
    </tr>
  );
};

type DocGuidanceProps = {
  pathwayState: GuidanceState;
};

const DocGuidance: FC<DocGuidanceProps> = ({ pathwayState }) => {
  const resource = pathwayState.action[0].resource;
  const coding =
    'medicationCodeableConcept' in resource
      ? resource.medicationCodeableConcept.coding
      : resource.code.coding;
  return (
    <>
      <DocNodeField key="Notes" title="Notes" description={pathwayState.action[0].description} />
      <DocNodeField key="Type" title="Type" description={resource.resourceType} />
      <DocNodeField
        key="System"
        title="System"
        description={
          <>
            {coding[0].system}
            <a href={coding[0].system} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon="external-link-alt" className={classes.externalLink} />
            </a>
          </>
        }
      />
      <DocNodeField key="Code" title="Code" description={coding[0].code} />
      <DocNodeField key="Display" title="Display" description={coding[0].display} />
    </>
  );
};

// TODO: move this function somewhere more reasonable
function parseResource(resource: fhir.DomainResource): ReactElement[] {
  const returnValue: ReactElement[] = [];
  switch (resource.resourceType) {
    case 'Procedure': {
      const procedure = resource as fhir.Procedure;
      const start = procedure?.performedPeriod?.start || procedure.performedDateTime;
      const end = procedure?.performedPeriod?.end;
      if (start) {
        returnValue.push(
          <DocNodeField
            key="Start"
            title="Start"
            description={new Date(start).toLocaleDateString('en-us')}
          />
        );
      }

      if (end) {
        returnValue.push(
          <DocNodeField
            key="End"
            title="End"
            description={new Date(end).toLocaleDateString('en-us')}
          />
        );
      }
      break;
    }
    case 'Observation': {
      const observation = resource as fhir.Observation;
      const date = observation.effectiveDateTime;
      date &&
        returnValue.push(
          <DocNodeField
            key="Date"
            title="Date"
            description={new Date(date).toLocaleDateString('en-us')}
          />
        );
      break;
    }
    case 'MedicationRequest': {
      const medicationRequest = resource as fhir.MedicationRequest;
      const date = medicationRequest.authoredOn;
      date &&
        returnValue.push(
          <DocNodeField
            key="Medication"
            title="Date"
            description={new Date(date).toLocaleDateString('en-us')}
          />
        );
    }
  }

  return returnValue;
}

export default DocNode;