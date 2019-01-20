// https://codesandbox.io/s/32yrn7nj6p

import * as React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import PluginDefinition from './model/PluginDefinition';


const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  // padding: grid * 2,
  // margin: `0 0 ${grid}px 0`,


  // change background colour if dragging
  background: isDragging
    ? 'lightgreen'
    : null,

  // styles we need to apply on draggables
  ...draggableStyle,
});

interface IProps {
  pluginDefinitions: PluginDefinition[];
  reorderPluginDef: (result: any) => void;
  changePluginDef: (evt:any) => void;
  removePluginDef: (evt:any) => void;
}

export default class SiteDetailPlugins extends React.Component<IProps, {}> {
  static defaultProps = {
    pluginDefinitions: [],
  }

  render() {
    return (
      <table className="table table-hover table-fixed">
        <thead className="blue-grey lighten-4">
          <tr className="row">
            <th className="col-4">Name</th>
            <th className="col-7">Options</th>
            <th className="col-1"></th>
          </tr>
        </thead>

          <DragDropContext onDragEnd={this.props.reorderPluginDef}>
            <Droppable droppableId="droppable">
              {provided => (
                <tbody ref={provided.innerRef}>
                  {this.props.pluginDefinitions.map((pluginDef, index) => (
                      <Draggable key={pluginDef.name} draggableId={pluginDef.name} index={index}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                            className="row"
                            >

                            <td className="col-4">
                              {pluginDef.name}
                            </td>
                            <td className="col-7">
                          {
                            //! snapshot.isDragging &&
                            (
                              Object.keys(pluginDef.opts).length > 0 ?
                                Object.keys(pluginDef.opts).map(optKey => (
                                  <div className="form-group row" key={optKey}>
                                    <label htmlFor={optKey} className="col-sm-2 col-form-label">{optKey}</label>
                                    <div className="col-sm-10">
                                      <input
                                        id={optKey} type="text" className="form-control"
                                        data-plugin-name={pluginDef.name}
                                        value={pluginDef.opts[optKey]}
                                        onChange={this.props.changePluginDef} />
                                    </div>
                                  </div>
                                ))
                                :
                                <p>No options available</p>
                            )
                          }
                        </td>
                        <td className="col-1">
                          {
                            !snapshot.isDragging &&
                            <i data-plugin-name={pluginDef.name} onClick={this.props.removePluginDef} className="table-hover-icon far fa-trash-alt"></i>
                          }

                        </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </DragDropContext>

      </table>
    );
  }
}
