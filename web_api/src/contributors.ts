export type Contributor = {
  id: number;
  description: string;
  date: string;
};
export type ExternalContributor = {
  id?: undefined;
  description: string;

  name: string;
  date: string;
  avatar?: string;
  link?: string;
};

export const contributeList: (Contributor | ExternalContributor)[] = [];
