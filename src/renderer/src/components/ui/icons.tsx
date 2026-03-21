import type { JSX } from "react";

type IconProps = {
  readonly className?: string;
  readonly size?: number | string;
  readonly strokeWidth?: number;
};

const DEFAULT_SIZE = "1.1em";

const resolveIconSize = (size: number | string): number | string =>
  typeof size === "number" ? size * 1.1 : size;

const IconBase = ({
  children,
  className,
  size = DEFAULT_SIZE,
  viewBox = "0 0 16 16",
}: IconProps & {
  readonly children: JSX.Element | JSX.Element[];
  readonly viewBox?: string;
}): JSX.Element => {
  const resolvedSize = resolveIconSize(size);

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={resolvedSize}
      style={{ display: "block", flexShrink: 0 }}
      viewBox={viewBox}
      width={resolvedSize}
    >
      {children}
    </svg>
  );
};

export const ChevronRightIcon = ({
  className,
  size,
  strokeWidth = 1.5,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M6 3.5 10.5 8 6 12.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const ChevronLeftIcon = ({
  className,
  size,
  strokeWidth = 1.5,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M10 3.5 5.5 8 10 12.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const ChevronDownIcon = ({
  className,
  size,
  strokeWidth = 1.5,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M3.5 6 8 10.5 12.5 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const FolderClosedIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M1.75 4.25h4.1l1.25 1.5h7.15v6.5H1.75z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const FolderOpenIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M1.75 4.25h4.1l1.25 1.5h7.15v1.1H6.25l-1.1 1.25H1.75z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M2.1 7.6h11.8l-1.2 4.15H.9z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const FileIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M4 1.75h5l3 3v9.5H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M9 1.75v3h3"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const ImageFileIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M4 1.75h5l3 3v9.5H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M5.5 10.5 7.4 8.6l1.6 1.35 1.7-2.2 1.3 2.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <circle cx="7" cy="6.5" fill="currentColor" r="0.75" />
  </IconBase>
);

export const BinaryFileIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M4 1.75h5l3 3v9.5H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M5.6 6.1h1.3v4.1H5.6zM9 6.1h1.3v4.1H9z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const ReadOnlyFileIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M4 1.75h5l3 3v9.5H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M5.75 9.15h4.5M5.75 11.1h3.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const PlusIcon = ({
  className,
  size,
  strokeWidth = 1.5,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M8 3v10M3 8h10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const MinusIcon = ({
  className,
  size,
  strokeWidth = 1.5,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M3 8h10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const DocumentIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M4 1.75h5l3 3v9.5H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M9 1.75v3h3"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const MagnifyingGlassIcon = ({
  className,
  size,
  strokeWidth = 1.45,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <circle
      cx="7"
      cy="7"
      r="3.75"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
    <path
      d="m10 10 3 3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const EyeIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M1.75 8c1.5-2.55 3.68-3.85 6.25-3.85S12.75 5.45 14.25 8c-1.5 2.55-3.68 3.85-6.25 3.85S3.25 10.55 1.75 8Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <circle
      cx="8"
      cy="8"
      r="2"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const EyeOffIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M2.25 2.25 13.75 13.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M6.25 4.55A7.53 7.53 0 0 1 8 4.15c2.57 0 4.75 1.3 6.25 3.85a10.75 10.75 0 0 1-2.25 2.58"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M10.2 10.32A4.66 4.66 0 0 1 8 11.85c-2.57 0-4.75-1.3-6.25-3.85A10.76 10.76 0 0 1 4.8 4.82"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const CloseIcon = ({
  className,
  size,
  strokeWidth = 1.5,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M4 4 12 12M12 4 4 12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const UndoIcon = ({
  className,
  size,
  strokeWidth = 1.45,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M6 5H3v3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M3 8c.9-2 2.8-3.2 5.2-3.2 2.9 0 5.3 2 5.8 4.7"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const ExpandIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <path
      d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
    <path
      d="M6 2.5 2.5 6M10 2.5 13.5 6M6 13.5 2.5 10M10 13.5 13.5 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);

export const GripIcon = ({ className, size }: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    {[
      [5, 4],
      [8, 4],
      [11, 4],
      [5, 8],
      [8, 8],
      [11, 8],
      [5, 12],
      [8, 12],
      [11, 12],
    ].map(([cx, cy]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} fill="currentColor" r="0.8" />
    ))}
  </IconBase>
);

export const CaptureIcon = ({
  className,
  size,
  strokeWidth = 1.35,
}: IconProps): JSX.Element => (
  <IconBase className={className} size={size}>
    <rect
      height="8"
      rx="1.5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      width="10"
      x="3"
      y="4"
    />
    <circle
      cx="8"
      cy="8"
      r="2.2"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
    <path
      d="M5.25 4 6.1 2.75h3.8L10.75 4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  </IconBase>
);
