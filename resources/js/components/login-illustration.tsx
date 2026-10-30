/**
 * Decorative pharmacy scene for the login page, in the tablet login's navy / cyan palette:
 * a medical cross with a heartbeat, bottles of several shapes, a blister pack, measuring spoons,
 * bandages and loose pills. Hidden from screen readers.
 */

const palette = {
    navy: '#234B91',
    navyShine: '#33609F',
    cyan: '#3EC1D6',
    cyanShine: '#6DD0E0',
    cyanSoft: '#A6E2EC',
    cyanPale: '#DDF4F8',
    white: '#FFFFFF',
    outline: '#D3DDEB',
};

function PlusSign({
    x,
    y,
    size,
    color,
}: {
    x: number;
    y: number;
    size: number;
    color: string;
}) {
    const bar = size / 3.25;

    return (
        <g fill={color}>
            <rect
                x={x - bar / 2}
                y={y - size / 2}
                width={bar}
                height={size}
                rx={2}
            />
            <rect
                x={x - size / 2}
                y={y - bar / 2}
                width={size}
                height={bar}
                rx={2}
            />
        </g>
    );
}

function Tablet({ cx, cy, r = 13 }: { cx: number; cy: number; r?: number }) {
    return (
        <g>
            <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <line
                x1={cx - r * 0.6}
                y1={cy}
                x2={cx + r * 0.6}
                y2={cy}
                stroke={palette.outline}
                strokeWidth={3}
                strokeLinecap="round"
            />
        </g>
    );
}

function Capsule({
    x,
    y,
    angle,
    color,
}: {
    x: number;
    y: number;
    angle: number;
    color: string;
}) {
    return (
        <g transform={`rotate(${angle} ${x} ${y})`}>
            <rect
                x={x - 30}
                y={y - 13}
                width={60}
                height={26}
                rx={13}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <path
                d={`M${x} ${y - 13} h17 a13 13 0 0 1 0 26 h-17 z`}
                fill={color}
            />
        </g>
    );
}

function Bandage({ x, y, angle }: { x: number; y: number; angle: number }) {
    return (
        <g transform={`rotate(${angle} ${x} ${y})`}>
            <rect
                x={x - 62}
                y={y - 15}
                width={124}
                height={30}
                rx={15}
                fill={palette.cyanSoft}
            />
            <rect
                x={x - 20}
                y={y - 12}
                width={40}
                height={24}
                rx={4}
                fill={palette.white}
            />
            {[-46, -36, 36, 46].map((offset) => (
                <g key={offset} fill={palette.white} opacity={0.8}>
                    <circle cx={x + offset} cy={y - 5} r={2} />
                    <circle cx={x + offset} cy={y + 5} r={2} />
                </g>
            ))}
        </g>
    );
}

function MeasuringSpoon({
    x,
    y,
    angle,
    scale,
    color,
    innerColor,
}: {
    x: number;
    y: number;
    angle: number;
    scale: number;
    color: string;
    innerColor: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
            <rect
                x={18}
                y={-6}
                width={78}
                height={12}
                rx={6}
                fill={color}
                stroke={palette.outline}
                strokeWidth={1.5}
            />
            <ellipse
                cx={0}
                cy={0}
                rx={28}
                ry={18}
                fill={color}
                stroke={palette.outline}
                strokeWidth={1.5}
            />
            <ellipse cx={0} cy={0} rx={19} ry={11} fill={innerColor} />
        </g>
    );
}

export function LoginIllustration({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 680 540"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {/* Medical cross and heartbeat */}
            <rect
                x={270}
                y={20}
                width={130}
                height={340}
                rx={12}
                fill={palette.white}
            />
            <rect
                x={180}
                y={105}
                width={310}
                height={125}
                rx={12}
                fill={palette.white}
            />
            <polyline
                points="215,150 262,150 280,118 300,186 322,100 342,166 358,150 455,150"
                fill="none"
                stroke={palette.cyan}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Floating plus signs */}
            <PlusSign x={130} y={78} size={26} color={palette.navy} />
            <PlusSign x={540} y={58} size={26} color={palette.navy} />
            <PlusSign x={600} y={150} size={22} color={palette.navy} />
            <PlusSign x={70} y={44} size={22} color={palette.cyanSoft} />
            <PlusSign x={40} y={330} size={22} color={palette.cyanSoft} />
            <PlusSign x={640} y={300} size={18} color={palette.cyanSoft} />
            <PlusSign x={470} y={36} size={16} color={palette.cyanSoft} />

            {/* Floor shadow */}
            <ellipse
                cx={340}
                cy={432}
                rx={300}
                ry={14}
                fill={palette.outline}
            />

            {/* Dropper bottle */}
            <rect
                x={84}
                y={150}
                width={30}
                height={42}
                rx={13}
                fill={palette.cyanPale}
            />
            <rect
                x={76}
                y={188}
                width={46}
                height={26}
                rx={5}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <rect
                x={60}
                y={212}
                width={78}
                height={218}
                rx={16}
                fill={palette.cyan}
            />
            <rect
                x={60}
                y={212}
                width={22}
                height={218}
                rx={11}
                fill={palette.cyanShine}
            />
            <rect
                x={71}
                y={262}
                width={56}
                height={70}
                rx={5}
                fill={palette.white}
            />
            <rect
                x={79}
                y={276}
                width={38}
                height={5}
                rx={2}
                fill={palette.cyanSoft}
            />
            <rect
                x={79}
                y={288}
                width={26}
                height={5}
                rx={2}
                fill={palette.cyanSoft}
            />

            {/* Syrup bottle with rounded shoulders */}
            <rect
                x={172}
                y={222}
                width={36}
                height={22}
                rx={4}
                fill={palette.navy}
            />
            <path
                d="M150 430 V300 C150 280 162 268 176 262 V242 H204 V262 C218 268 230 280 230 300 V430 Z"
                fill={palette.cyanSoft}
            />
            <rect
                x={158}
                y={298}
                width={10}
                height={120}
                rx={5}
                fill={palette.white}
                opacity={0.5}
            />
            <rect
                x={164}
                y={318}
                width={54}
                height={62}
                rx={6}
                fill={palette.white}
            />
            <PlusSign x={191} y={349} size={22} color={palette.cyan} />

            {/* Pill jar */}
            <rect
                x={246}
                y={262}
                width={110}
                height={34}
                rx={7}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <g stroke={palette.cyanPale} strokeWidth={3}>
                {[262, 278, 294, 310, 326, 342].map((x) => (
                    <line key={x} x1={x} y1={268} x2={x} y2={290} />
                ))}
            </g>
            <rect
                x={252}
                y={294}
                width={98}
                height={136}
                rx={12}
                fill={palette.navy}
            />
            <rect x={252} y={334} width={98} height={42} fill={palette.cyan} />
            <rect
                x={262}
                y={302}
                width={13}
                height={120}
                rx={6.5}
                fill={palette.navyShine}
            />

            {/* Blister pack */}
            <rect
                x={368}
                y={332}
                width={124}
                height={98}
                rx={12}
                fill={palette.cyanSoft}
            />
            {[360, 404].map((cy) =>
                [390, 418, 446, 474].map((cx) => (
                    <g key={`${cx}-${cy}`}>
                        <circle cx={cx} cy={cy} r={12} fill={palette.white} />
                        <line
                            x1={cx - 7}
                            y1={cy}
                            x2={cx + 7}
                            y2={cy}
                            stroke={palette.cyanSoft}
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    </g>
                )),
            )}

            {/* Big jar */}
            <rect
                x={508}
                y={258}
                width={112}
                height={30}
                rx={7}
                fill={palette.cyan}
            />
            <rect
                x={512}
                y={286}
                width={104}
                height={144}
                rx={16}
                fill={palette.navy}
            />
            <rect
                x={524}
                y={322}
                width={80}
                height={60}
                rx={5}
                fill={palette.white}
            />
            <rect
                x={534}
                y={336}
                width={58}
                height={6}
                rx={3}
                fill={palette.cyanSoft}
            />
            <rect
                x={534}
                y={350}
                width={40}
                height={6}
                rx={3}
                fill={palette.cyanSoft}
            />
            <rect
                x={522}
                y={294}
                width={14}
                height={128}
                rx={7}
                fill={palette.navyShine}
            />

            {/* Small vial in front of the blister */}
            <rect
                x={470}
                y={358}
                width={30}
                height={14}
                rx={3}
                fill={palette.navy}
            />
            <rect
                x={468}
                y={370}
                width={34}
                height={60}
                rx={6}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <rect
                x={471}
                y={394}
                width={28}
                height={33}
                rx={4}
                fill={palette.cyan}
            />

            {/* Measuring spoons */}
            <MeasuringSpoon
                x={96}
                y={470}
                angle={-10}
                scale={1}
                color={palette.white}
                innerColor={palette.cyanSoft}
            />
            <MeasuringSpoon
                x={150}
                y={505}
                angle={-6}
                scale={0.75}
                color={palette.navy}
                innerColor={palette.navyShine}
            />

            {/* Bandages */}
            <Bandage x={330} y={480} angle={-16} />
            <Bandage x={365} y={498} angle={12} />

            {/* Bandage roll with a loose end */}
            <rect
                x={566}
                y={486}
                width={86}
                height={14}
                rx={4}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <circle
                cx={574}
                cy={470}
                r={30}
                fill={palette.white}
                stroke={palette.outline}
                strokeWidth={2}
            />
            <circle
                cx={574}
                cy={470}
                r={18}
                fill="none"
                stroke={palette.cyanPale}
                strokeWidth={3}
            />
            <circle cx={574} cy={470} r={9} fill={palette.outline} />

            {/* Loose capsules and tablets */}
            <Capsule x={232} y={466} angle={-28} color={palette.navy} />
            <Capsule x={462} y={492} angle={24} color={palette.cyan} />
            <Capsule x={36} y={430} angle={-60} color={palette.cyan} />
            <Tablet cx={206} cy={508} />
            <Tablet cx={240} cy={518} r={11} />
            <Tablet cx={430} cy={462} />
            <Tablet cx={512} cy={470} r={11} />
            <Tablet cx={420} cy={522} r={11} />
            <Tablet cx={640} cy={430} r={12} />
        </svg>
    );
}
