import { connect } from "mongoose";

export const connectDb = (uri: string) => connect(uri);
