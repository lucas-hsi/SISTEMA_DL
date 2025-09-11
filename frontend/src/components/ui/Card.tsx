import React from 'react';
import { CardProps } from '../../types';
import './Card.css';

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  hover = false,
  className = '',
  onClick,
  ...rest
}) => {

  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    `card--shadow-${shadow}`,
    hover && 'card--hover',
    onClick && 'card--clickable',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const cardProps = {
    className: cardClasses,
    style: rest.style,
    onClick: onClick ? handleClick : undefined,
    onKeyDown: onClick ? handleKeyDown : undefined,
    tabIndex: onClick ? 0 : undefined,
    role: onClick ? 'button' : undefined,
    'aria-pressed': onClick ? false : undefined,
    ...rest
  };

  return (
    <div {...cardProps}>
      {children}
    </div>
  );
};

// Card Header Component
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
};

// Card Body Component
export const CardBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  );
};

// Card Title Component
export const CardTitle: React.FC<{
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}> = ({ children, level = 3, className = '' }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={`card-title card-title--h${level} ${className}`}>
      {children}
    </Tag>
  );
};

// Card Description Component
export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <p className={`card-description ${className}`}>
      {children}
    </p>
  );
};

export default Card;