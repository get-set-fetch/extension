import React from 'react';

interface IProps {
  className: string;
  anchor: React.ReactElement;
}

const Dropdown:React.FC<IProps> = props => {
  const [ open, setOpen ] = React.useState(false);
  const drop = React.useRef(null);

  function handleOutsideClick(e) {
    if (!e.target.closest(`.${drop.current.className}`) && open) {
      setOpen(false);
    }
  }

  React.useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  });

  return (
    <div
      className={props.className}
      ref={drop}
    >
      {
        React.cloneElement(props.anchor, { onClick: () => setOpen(open => !open) })
      }
      {
        // assumes a single direct child is present
        open && React.Children.map(
          props.children, (child:React.ReactElement) => React.cloneElement(
            child,
            {
              onClick: () => setOpen(false),
            },
          ),
        )
      }
    </div>
  );
};

export default Dropdown;
