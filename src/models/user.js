import {BaseEntity,Entity,Column,PrimaryColumn,OneToMany} from "typeorm";
import {Visit} from "./visit";

@Entity()
export class User extends BaseEntity {

    @Column("text")
    name = "";

    @PrimaryColumn("numeric")
    idNumber = 0;

    @Column("boolean")
    labMonitor = false;

    @Column("boolean")
    exec = false;

    @Column("boolean")
    admin = false;

    @Column("boolean")
    needsPassword = false;

    @Column("text")
    nickname = "";

    @Column("text")
    username = "";

    @Column("text")
    password = "";

    @Column("text")
    salt = "";

    @OneToMany(type => Visit, visits => Visit.user, {cascade: true})
    swipes = undefined;
}