import { makeObservable, observable, action } from "mobx";
import { AlertColor } from "@mui/material";
import { nanoid } from "nanoid";

interface SnackbarData {
	message: string;
	type: AlertColor;
}

interface SnackbarItem extends SnackbarData {
	id: string;
}

class SnackbarStore {
	snackbarData: SnackbarItem | null = null;

	constructor() {
		makeObservable(this, {
			snackbarData: observable,
			setSnackbar: action,
			clearSnackbarData: action,
		});
	}

	setSnackbar(data: SnackbarData) {
		this.snackbarData = { ...data, id: nanoid() };
	}

	clearSnackbarData() {
		this.snackbarData = null;
	}
}

const snackbarStore = new SnackbarStore();

export default snackbarStore;
