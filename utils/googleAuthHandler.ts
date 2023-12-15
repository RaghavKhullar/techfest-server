import axios from "axios";

// ToDO: Handle the case when correct details are not fetched
export const getTokensGoogle = async (code: string, isAdmin: boolean) => {
    try {
        const url = "https://oauth2.googleapis.com/token";
        const options = {
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID as string,
            client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
            redirect_uri: isAdmin
                ? (process.env.GOOGLE_ADMIN_REDIRECT_URL as string)
                : (process.env.GOOGLE_USER_REDIRECT_URL as string),
            grant_type: "authorization_code",
        };

        const querySearch = new URLSearchParams(options);

        const tokens = await axios({
            method: "post",
            url: url,
            data: querySearch.toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return tokens.data;
    } catch (err: any) {
        throw Error(err);
    }
};

export const getGoogleUser = async (id_token: string, access_token: string) => {
    try {
        const user = await axios({
            method: "get",
            url: `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
            headers: {
                Authorization: `Bearer ${id_token}`,
            },
        });
        return user.data;
    } catch (err: any) {
        throw new Error(err);
    }
};
