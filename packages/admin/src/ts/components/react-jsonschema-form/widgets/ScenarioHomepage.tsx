import * as React from 'react';

const ScenarioHomepage = (props) => {
  return (
    <a href={props.value} target='_blank'>{props.value}</a>
  );
};

export default ScenarioHomepage;