import React, { FC, Ref, forwardRef } from 'react';
import { GuidanceState, State, DocumentationResource } from 'pathways-model';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './Node.module.scss';
import nodeStyles from 'styles/index.module.scss';
import ExpandedNode from 'components/ExpandedNode';
import { isGuidanceState } from 'utils/nodeUtils';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faMicroscope,
  faPlay,
  faPrescriptionBottleAlt,
  faCapsules,
  faSyringe,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

interface NodeProps {
  pathwayState: State;
  documentation: DocumentationResource | undefined;
  isOnPatientPath: boolean;
  isCurrentNode: boolean;
  xCoordinate: number;
  yCoordinate: number;
  expanded?: boolean;
  onClickHandler?: () => void;
}

const Node: FC<NodeProps & { ref: Ref<HTMLDivElement> }> = forwardRef<HTMLDivElement, NodeProps>(
  (
    {
      pathwayState,
      documentation,
      isOnPatientPath,
      isCurrentNode,
      xCoordinate,
      yCoordinate,
      expanded = false,
      onClickHandler
    },
    ref
  ) => {
    const { label } = pathwayState;
    const style = {
      top: yCoordinate,
      left: xCoordinate
    };

    const backgroundColorClass = isOnPatientPath ? styles.onPatientPath : styles.notOnPatientPath;
    const isActionable = isCurrentNode && !documentation;
    const topLevelClasses = [styles.node, backgroundColorClass];
    let expandedNodeClass = '';
    if (expanded) topLevelClasses.push(nodeStyles.expanded);
    if (isActionable) {
      topLevelClasses.push(styles.actionable);
      expandedNodeClass = styles.childActionable;
    } else {
      expandedNodeClass = isOnPatientPath
        ? styles.childOnPatientPath
        : styles.childNotOnPatientPath;
    }
    const isGuidance = isGuidanceState(pathwayState);
    // TODO: how do we determine whether a node has been accepted or declined?
    // for now:
    // if it's a non-actionable guidance state on the path: accepted == has documentation
    // if it's actionable, not guidance or not on the path: null
    const wasActionTaken = isOnPatientPath && isGuidance && !isActionable;
    const isAccepted = wasActionTaken ? documentation?.resourceType !== 'DocumentReference' : null;

    return (
      <div className={topLevelClasses.join(' ')} style={style} ref={ref}>
        <div className={nodeStyles.nodeTitle} onClick={onClickHandler}>
          <div className={nodeStyles.iconAndLabel}>
            <NodeIcon pathwayState={pathwayState} isGuidance={isGuidance} />
            {label}
          </div>
          <StatusIcon accepted={isAccepted} />
        </div>
        {expanded && (
          <div className={`${styles.expandedNode} ${expandedNodeClass}`}>
            <ExpandedNode
              pathwayState={pathwayState as GuidanceState}
              isActionable={isActionable}
              isGuidance={isGuidance}
              documentation={documentation}
            />
          </div>
        )}
      </div>
    );
  }
);

interface NodeIconProps {
  pathwayState: State;
  isGuidance: boolean;
}

const NodeIcon: FC<NodeIconProps> = ({ pathwayState, isGuidance }) => {
  let icon: IconProp = faMicroscope;
  if (pathwayState.label === 'Start') icon = faPlay;
  if (isGuidance) {
    const guidancePathwayState = pathwayState as GuidanceState;
    if (guidancePathwayState.action.length > 0) {
      const resourceType = guidancePathwayState.action[0].resource.resourceType;
      if (resourceType === 'MedicationRequest') icon = faPrescriptionBottleAlt;
      else if (resourceType === 'MedicationAdministration') icon = faCapsules;
      else if (resourceType === 'Procedure') icon = faSyringe;
    }
  }
  return <FontAwesomeIcon icon={icon} className={styles.icon} />;
};

interface StatusIconProps {
  accepted: boolean | null;
}

const StatusIcon: FC<StatusIconProps> = ({ accepted }) => {
  if (accepted == null) {
    return null;
  }
  const icon = accepted ? faCheckCircle : faTimesCircle;
  return (
    <div className={nodeStyles.statusIcon}>
      <FontAwesomeIcon icon={icon} className={styles.icon} />
    </div>
  );
};

export default Node;