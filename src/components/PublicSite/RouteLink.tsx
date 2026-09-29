import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigate } from "../../utils/publicRouting";

interface RouteLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

const RouteLink = ({ to, children, onClick, ...props }: RouteLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target
    ) return;

    event.preventDefault();
    navigate(to);
  };

  return <a href={to} onClick={handleClick} {...props}>{children}</a>;
};

export default RouteLink;
