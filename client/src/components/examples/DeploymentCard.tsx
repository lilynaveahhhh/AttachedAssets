import DeploymentCard from '../DeploymentCard';

export default function DeploymentCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <DeploymentCard
        environment="blue"
        version="v2.4.1"
        commitHash="a3f7b2c"
        commitMessage="Fix authentication bug"
        status="active"
        healthStatus="healthy"
        trafficPercentage={100}
        onPromote={() => console.log('Promote blue')}
        onRollback={() => console.log('Rollback blue')}
      />
      <DeploymentCard
        environment="green"
        version="v2.5.0"
        commitHash="d9e1c4a"
        commitMessage="Add new dashboard features"
        status="idle"
        healthStatus="healthy"
        trafficPercentage={0}
        onPromote={() => console.log('Promote green')}
      />
    </div>
  );
}
