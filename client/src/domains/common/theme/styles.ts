export const styles = {
    global: {
        "::selection": {
            backgroundColor: "brand.light",
            color: "whiteAlpha.900",
        },
        body: {
            height: "100vh",
            backgroundColor: "gray.600",
            overflowX: "hidden",
            "::-webkit-scrollbar-thumb": {
                backgroundColor: "brand.default",
                backgroundClip: "padding-box",
                border: "4px solid transparent",
                borderRadius: 100,
            },
        },
        "#root": {
            height: "100%",
            display: "flex",
        },
        "img, svg, ::placeholder": {
            userSelect: "none",
        },
        "::-webkit-scrollbar": {
            width: "1.2rem",
        },
        "::-webkit-scrollbar-thumb": {
            backgroundClip: "padding-box",
            border: "4px solid transparent",
            backgroundColor: "brand.default",
            borderRadius: 100,
        },
        "::-webkit-scrollbar-track": {
            backgroundColor: "gray.900",
        },
        h1: {
            fontWeight: 700,
            fontSize: "5xl",
        },
        h2: {
            fontWeight: 700,
            fontSize: "3xl",
        },
        h3: {
            fontWeight: 700,
            fontSize: "2xl",
        },
        h4: {
            fontWeight: 700,
            fontSize: "xl",
        },
        h5: {
            fontWeight: 600,
            fontSize: "lg",
        },
        h6: {
            fontWeight: 600,
            fontSize: "md",
        },
        ".Toastify__toast--error": {
            borderLeft: "4px solid",
            borderColor: "danger",
        },
        ".Toastify__toast--info": {
            borderLeft: "4px solid",
            borderColor: "primary.light",
        },
        ".Toastify__toast--success": {
            borderLeft: "4px solid",
            borderColor: "success",
        },
        "input[disabled], textarea[disabled]": {
            cursor: "not-allowed",
        },
    },
};
