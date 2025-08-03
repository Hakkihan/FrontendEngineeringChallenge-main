type Doc =  {
    documentId: number,
    content: string,
    patent_entity_id: number | undefined
}

type PatentEntity = {
    entityId: number,
    name: string
}

//import { useMutation, useQuery } from "@tanstack/react-query";